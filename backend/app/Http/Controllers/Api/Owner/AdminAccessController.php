<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\AdminFeatureAccess;
use App\Models\Feature;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminAccessController extends Controller
{
    /**
     * GET /api/owner/admin-access/features
     */
    public function features(Request $request): JsonResponse
    {
        $query = Feature::query();

        if (!$request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        $features = $query->orderBy('group')->orderBy('name')->get()
            ->map(fn (Feature $feature) => $this->formatFeature($feature))
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'features' => $features,
                'grouped' => $features->groupBy('group')->map->values(),
            ],
        ]);
    }

    /**
     * GET /api/owner/admin-access/admins
     */
    public function admins(): JsonResponse
    {
        $admins = User::whereIn('role', ['owner', 'employee'])
            ->withCount('featureAccesses')
            ->orderBy('role')
            ->orderBy('name')
            ->get()
            ->map(fn (User $admin) => $this->formatAdmin($admin));

        return response()->json([
            'success' => true,
            'data' => $admins,
        ]);
    }

    /**
     * GET /api/owner/admin-access/admins/{admin}/accesses
     */
    public function accesses(int $admin): JsonResponse
    {
        $adminUser = $this->findAdmin($admin);

        if (!$adminUser) {
            return $this->adminNotFoundResponse();
        }

        $features = Feature::where('is_active', true)
            ->orderBy('group')
            ->orderBy('name')
            ->get();

        $accesses = AdminFeatureAccess::with('feature')
            ->where('user_id', $adminUser->id)
            ->get()
            ->keyBy('feature_id');

        return response()->json([
            'success' => true,
            'data' => [
                'admin' => $this->formatAdmin($adminUser),
                'accesses' => $features->map(function (Feature $feature) use ($adminUser, $accesses) {
                    return $this->formatAccessState($adminUser, $feature, $accesses->get($feature->id));
                })->values(),
            ],
        ]);
    }

    /**
     * POST /api/owner/admin-access/admins/{admin}/accesses
     */
    public function store(Request $request, int $admin): JsonResponse
    {
        $adminUser = $this->findAdmin($admin);

        if (!$adminUser) {
            return $this->adminNotFoundResponse();
        }

        if ($adminUser->role !== 'employee') {
            return $this->ownerWriteBlockedResponse();
        }

        $validated = $request->validate([
            'feature_id' => ['required_without:feature_slug', 'integer', 'exists:features,id'],
            'feature_slug' => ['required_without:feature_id', 'string', 'exists:features,slug'],
            'permissions' => ['sometimes', 'array', 'min:1'],
            'permissions.*' => ['string', Rule::in(array_keys(AdminFeatureAccess::PERMISSION_COLUMNS))],
        ]);

        $feature = $this->resolveFeature($validated['feature_id'] ?? null, $validated['feature_slug'] ?? null);

        if (!$feature || !$feature->is_active) {
            return $this->featureNotFoundResponse();
        }

        $exists = AdminFeatureAccess::where('user_id', $adminUser->id)
            ->where('feature_id', $feature->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Akses fitur sudah ada. Gunakan endpoint update untuk mengubah akses.',
            ], 409);
        }

        $access = AdminFeatureAccess::create([
            'user_id' => $adminUser->id,
            'feature_id' => $feature->id,
            ...$this->permissionData($validated['permissions'] ?? ['view']),
            'granted_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Akses fitur berhasil ditambahkan',
            'data' => $this->formatAccess($access->load('feature')),
        ], 201);
    }

    /**
     * PUT /api/owner/admin-access/admins/{admin}/accesses/{feature}
     */
    public function update(Request $request, int $admin, string $feature): JsonResponse
    {
        $adminUser = $this->findAdmin($admin);

        if (!$adminUser) {
            return $this->adminNotFoundResponse();
        }

        if ($adminUser->role !== 'employee') {
            return $this->ownerWriteBlockedResponse();
        }

        $validated = $request->validate([
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => ['string', Rule::in(array_keys(AdminFeatureAccess::PERMISSION_COLUMNS))],
        ]);

        $featureModel = $this->resolveFeatureIdentifier($feature);

        if (!$featureModel || !$featureModel->is_active) {
            return $this->featureNotFoundResponse();
        }

        $access = AdminFeatureAccess::where('user_id', $adminUser->id)
            ->where('feature_id', $featureModel->id)
            ->first();

        if (!$access) {
            return response()->json([
                'success' => false,
                'message' => 'Akses fitur belum diberikan',
            ], 404);
        }

        $access->update($this->permissionData($validated['permissions']));

        return response()->json([
            'success' => true,
            'message' => 'Akses fitur berhasil diperbarui',
            'data' => $this->formatAccess($access->fresh()->load('feature')),
        ]);
    }

    /**
     * DELETE /api/owner/admin-access/admins/{admin}/accesses/{feature}
     */
    public function destroy(int $admin, string $feature): JsonResponse
    {
        $adminUser = $this->findAdmin($admin);

        if (!$adminUser) {
            return $this->adminNotFoundResponse();
        }

        if ($adminUser->role !== 'employee') {
            return $this->ownerWriteBlockedResponse();
        }

        $featureModel = $this->resolveFeatureIdentifier($feature);

        if (!$featureModel) {
            return $this->featureNotFoundResponse();
        }

        $access = AdminFeatureAccess::where('user_id', $adminUser->id)
            ->where('feature_id', $featureModel->id)
            ->first();

        if (!$access) {
            return response()->json([
                'success' => false,
                'message' => 'Akses fitur belum diberikan',
            ], 404);
        }

        $access->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akses fitur berhasil dihapus',
        ]);
    }

    private function findAdmin(int $adminId): ?User
    {
        return User::where('id', $adminId)
            ->whereIn('role', ['owner', 'employee'])
            ->first();
    }

    private function resolveFeature(?int $featureId, ?string $featureSlug): ?Feature
    {
        if ($featureId) {
            return Feature::find($featureId);
        }

        return Feature::where('slug', $featureSlug)->first();
    }

    private function resolveFeatureIdentifier(string $feature): ?Feature
    {
        if (ctype_digit($feature)) {
            return Feature::find((int) $feature);
        }

        return Feature::where('slug', $feature)->first();
    }

    private function permissionData(array $permissions): array
    {
        $permissions = array_values(array_unique($permissions));

        if (array_diff($permissions, ['view']) && !in_array('view', $permissions, true)) {
            $permissions[] = 'view';
        }

        return [
            'can_view' => in_array('view', $permissions, true),
            'can_create' => in_array('create', $permissions, true),
            'can_update' => in_array('update', $permissions, true),
            'can_delete' => in_array('delete', $permissions, true),
        ];
    }

    private function formatAdmin(User $admin): array
    {
        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'phone' => $admin->phone,
            'email' => $admin->email,
            'role' => $admin->role,
            'status' => $admin->status,
            'access_count' => $admin->role === 'owner'
                ? 'all'
                : ($admin->feature_accesses_count ?? $admin->featureAccesses()->count()),
        ];
    }

    private function formatFeature(Feature $feature): array
    {
        return [
            'id' => $feature->id,
            'slug' => $feature->slug,
            'name' => $feature->name,
            'group' => $feature->group,
            'description' => $feature->description,
            'is_active' => $feature->is_active,
        ];
    }

    private function formatAccess(AdminFeatureAccess $access): array
    {
        return [
            'feature' => $this->formatFeature($access->feature),
            'permissions' => $access->permissionList(),
            'can_view' => $access->can_view,
            'can_create' => $access->can_create,
            'can_update' => $access->can_update,
            'can_delete' => $access->can_delete,
            'granted_by' => $access->granted_by,
        ];
    }

    private function formatAccessState(User $admin, Feature $feature, ?AdminFeatureAccess $access): array
    {
        if ($admin->role === 'owner') {
            return [
                'feature' => $this->formatFeature($feature),
                'permissions' => array_keys(AdminFeatureAccess::PERMISSION_COLUMNS),
                'can_view' => true,
                'can_create' => true,
                'can_update' => true,
                'can_delete' => true,
                'source' => 'owner_bypass',
            ];
        }

        if (!$access) {
            return [
                'feature' => $this->formatFeature($feature),
                'permissions' => [],
                'can_view' => false,
                'can_create' => false,
                'can_update' => false,
                'can_delete' => false,
                'source' => 'none',
            ];
        }

        return $this->formatAccess($access) + ['source' => 'assigned'];
    }

    private function adminNotFoundResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Admin tidak ditemukan',
        ], 404);
    }

    private function featureNotFoundResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Fitur tidak ditemukan atau tidak aktif',
        ], 404);
    }

    private function ownerWriteBlockedResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Akses owner tidak perlu diatur karena owner memiliki semua akses.',
        ], 422);
    }
}
