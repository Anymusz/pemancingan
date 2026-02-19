<?php
// File: app/Http/Controllers/Api/Owner/MenuController.php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MenuController extends Controller
{
    /**
     * GET /api/owner/menus
     * List semua menu dengan filtering & search
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->boolean('include_deleted')
            ? Menu::withTrashed()
            : Menu::query();

        // Filter by category
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Filter by availability
        if ($request->filled('availability')) {
            $query->where('availability', $request->availability);
        }

        // Search by name (case-insensitive)
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $menus = $query->orderBy('category')->orderBy('name')->get();

        // Count summary (tanpa filter availability untuk summary global)
        $baseQuery = $request->boolean('include_deleted')
            ? Menu::withTrashed()
            : Menu::query();

        $availableCount = (clone $baseQuery)->where('availability', 'available')->count();
        $unavailableCount = (clone $baseQuery)->where('availability', 'unavailable')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'menus' => $menus,
                'total' => $availableCount + $unavailableCount,
                'available_count' => $availableCount,
                'unavailable_count' => $unavailableCount,
            ],
        ]);
    }

    /**
     * POST /api/owner/menus
     * Tambah menu baru
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'category' => 'required|in:food,beverage',
            'availability' => 'sometimes|in:available,unavailable',
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $menu = DB::transaction(function () use ($validated) {
                return Menu::create([
                    'name' => $validated['name'],
                    'price' => $validated['price'],
                    'category' => $validated['category'],
                    'availability' => $validated['availability'] ?? 'available',
                    'description' => $validated['description'] ?? null,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Menu berhasil ditambahkan',
                'data' => ['menu' => $menu],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan menu',
            ], 500);
        }
    }

    /**
     * PUT /api/owner/menus/{id}
     * Edit menu existing
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $menu = Menu::find($id);

        if (!$menu) {
            return response()->json([
                'success' => false,
                'message' => 'Menu tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'category' => 'required|in:food,beverage',
            'availability' => 'sometimes|in:available,unavailable',
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $menu->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Menu berhasil diperbarui',
                'data' => ['menu' => $menu->fresh()],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui menu',
            ], 500);
        }
    }

    /**
     * DELETE /api/owner/menus/{id}
     * Soft delete menu
     */
    public function destroy(int $id): JsonResponse
    {
        $menu = Menu::withTrashed()->find($id);

        if (!$menu) {
            return response()->json([
                'success' => false,
                'message' => 'Menu tidak ditemukan',
            ], 404);
        }

        if ($menu->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Menu sudah dihapus sebelumnya',
            ], 400);
        }

        $menu->delete();

        return response()->json([
            'success' => true,
            'message' => 'Menu berhasil dihapus',
        ]);
    }

    /**
     * PATCH /api/owner/menus/{id}/availability
     * Toggle availability menu
     */
    public function updateAvailability(Request $request, int $id): JsonResponse
    {
        $menu = Menu::find($id);

        if (!$menu) {
            return response()->json([
                'success' => false,
                'message' => 'Menu tidak ditemukan',
            ], 404);
        }

        $request->validate([
            'availability' => 'required|in:available,unavailable',
        ]);

        $menu->update(['availability' => $request->availability]);

        return response()->json([
            'success' => true,
            'message' => 'Status ketersediaan berhasil diubah',
            'data' => ['menu' => $menu->fresh()],
        ]);
    }
}