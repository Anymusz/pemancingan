<?php
// File: app/Http/Controllers/Api/Owner/FishTypeController.php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\FishType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FishTypeController extends Controller
{
    /**
     * GET /api/owner/fish-types
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->boolean('include_deleted')
            ? FishType::withTrashed()->with('stock')
            : FishType::query()->with('stock');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $fishTypes = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'fish_types' => $fishTypes,
                'total' => $fishTypes->count(),
            ],
        ]);
    }

    /**
     * POST /api/owner/fish-types
     */
    public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'name'         => 'required|string|max:50|unique:fish_types,name',
        'price_per_kg' => 'required|numeric|min:1000',
    ]);

    try {
        $fishType = FishType::create($validated);

        $fishType->stock()->create([
            'current_stock_kg'   => 0,
            'alert_threshold_kg' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jenis ikan berhasil ditambahkan',
            'data'    => ['fish_type' => $fishType->load('stock')],
        ], 201);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Gagal menambahkan jenis ikan',
        ], 500);
    }
}

    /**
     * PUT /api/owner/fish-types/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $fishType = FishType::find($id);

        if (!$fishType) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis ikan tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:fish_types,name,' . $id,
            'price_per_kg' => 'required|numeric|min:1000',
        ]);

        try {
            $fishType->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Data ikan berhasil diperbarui',
                'data' => ['fish_type' => $fishType->fresh()],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui jenis ikan',
            ], 500);
        }
    }

    /**
     * DELETE /api/owner/fish-types/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $fishType = FishType::withTrashed()->find($id);

        if (!$fishType) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis ikan tidak ditemukan',
            ], 404);
        }

        if ($fishType->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis ikan sudah dihapus sebelumnya',
            ], 400);
        }

        $fishType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Jenis ikan berhasil dihapus',
        ]);
    }
    /**
     * PATCH /api/owner/fish-types/{id}/toggle-active
     */
    public function toggleActive(int $id): JsonResponse
    {
        $fishType = FishType::find($id);

        if (!$fishType) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis ikan tidak ditemukan',
            ], 404);
        }

        $fishType->update(['is_active' => !$fishType->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Status ikan berhasil diubah',
            'data' => ['fish_type' => $fishType->fresh()],
        ]);
    }
}
