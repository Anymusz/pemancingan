<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminAccessController extends Controller
{
    /**
     * GET /api/owner/admin-access/admins
     */
    public function admins(): JsonResponse
    {
        $admins = User::whereIn('role', ['owner', 'employee'])
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
     * POST /api/owner/admin-access/admins
     */
    public function storeAdmin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30', 'unique:users,phone'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'address' => ['sometimes', 'nullable', 'string'],
        ]);

        $adminUser = User::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'address' => ($validated['address'] ?? null) ?: '-',
            'role' => 'employee',
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Akun pegawai berhasil dibuat',
            'data' => [
                'admin' => $this->formatAdmin($adminUser),
            ],
        ], 201);
    }

    /**
     * PUT /api/owner/admin-access/admins/{admin}
     */
    public function updateAdmin(Request $request, int $admin): JsonResponse
    {
        $adminUser = $this->findEmployeeAdmin($admin);

        if (!$adminUser) {
            return $this->adminNotFoundResponse();
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:30', Rule::unique('users', 'phone')->ignore($adminUser->id)],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($adminUser->id)],
            'password' => ['sometimes', 'string', 'min:8'],
            'address' => ['sometimes', 'nullable', 'string'],
        ]);

        if ($validated === []) {
            return response()->json([
                'success' => false,
                'message' => 'Minimal satu field harus diisi untuk mengubah akun pegawai.',
            ], 422);
        }

        if (array_key_exists('address', $validated)) {
            $validated['address'] = $validated['address'] ?: '-';
        }

        $adminUser->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Akun pegawai berhasil diperbarui',
            'data' => [
                'admin' => $this->formatAdmin($adminUser->fresh()),
            ],
        ]);
    }

    /**
     * DELETE /api/owner/admin-access/admins/{admin}
     */
    public function destroyAdmin(int $admin): JsonResponse
    {
        $adminUser = $this->findEmployeeAdmin($admin);

        if (!$adminUser) {
            return $this->adminNotFoundResponse();
        }

        try {
            DB::transaction(function () use ($adminUser) {
                $adminUser->tokens()->delete();
                $adminUser->delete();
            });
        } catch (QueryException) {
            return response()->json([
                'success' => false,
                'message' => 'Akun pegawai tidak bisa dihapus karena sudah memiliki riwayat operasional.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Akun pegawai berhasil dihapus',
        ]);
    }

    private function findEmployeeAdmin(int $adminId): ?User
    {
        return User::where('id', $adminId)
            ->where('role', 'employee')
            ->first();
    }

    private function formatAdmin(User $admin): array
    {
        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'phone' => $admin->phone,
            'email' => $admin->email,
            'address' => $admin->address,
            'role' => $admin->role,
            'status' => $admin->status,
            'created_at' => $admin->created_at,
            'updated_at' => $admin->updated_at,
        ];
    }

    private function adminNotFoundResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Pegawai tidak ditemukan',
        ], 404);
    }
}
