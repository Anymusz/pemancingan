<?php
// File: app/Http/Controllers/Api/Owner/MenuController.php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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

        $menus = $query->orderBy('is_special', 'desc')->orderBy('category')->orderBy('name')->get()->map(function ($menu) {
            $menu->is_special = (bool) $menu->is_special;
            return $menu;
        });

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
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'category' => 'required|in:food,beverage',
            'availability' => 'sometimes|in:available,unavailable',
            'description' => 'nullable|string|max:500',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        try {
            $imageFilename = null;
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $imageFilename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                $file->storeAs('menus', $imageFilename, 'public');
            }

            $menu = DB::transaction(function () use ($validated, $imageFilename) {
                return Menu::create([
                    'name' => $validated['name'],
                    'price' => $validated['price'],
                    'category' => $validated['category'],
                    'availability' => $validated['availability'] ?? 'available',
                    'description' => $validated['description'] ?? null,
                    'image' => $imageFilename,
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
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'remove_image' => 'sometimes|boolean',
        ]);

        try {
            if ($request->boolean('remove_image') && $menu->image) {
                Storage::disk('public')->delete('menus/' . $menu->image);
                $validated['image'] = null;
            } elseif ($request->hasFile('image')) {
                if ($menu->image) {
                    Storage::disk('public')->delete('menus/' . $menu->image);
                }
                $file = $request->file('image');
                $imageFilename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                $file->storeAs('menus', $imageFilename, 'public');
                $validated['image'] = $imageFilename;
            } else {
                unset($validated['image']);
            }

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

        $updateData = ['availability' => $request->availability];
        if ($request->availability === 'unavailable') {
            $updateData['is_special'] = false;
        }

        $menu->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Status ketersediaan berhasil diubah',
            'data' => ['menu' => $menu->fresh()],
        ]);
    }

    /**
     * PATCH /api/owner/menus/{id}/toggle-special
     */
    public function toggleSpecial(int $id): JsonResponse
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

        if (!$menu->is_special) {
            if ($menu->availability !== 'available') {
                return response()->json([
                    'success' => false,
                    'message' => 'Menu harus tersedia untuk dijadikan spesial.',
                ], 422);
            }

            $count = Menu::where('is_special', true)->where('id', '!=', $id)->count();
            if ($count >= 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Maksimal 3 menu spesial aktif. Nonaktifkan salah satu terlebih dahulu.',
                ], 422);
            }
        }

        $menu->update(['is_special' => !$menu->is_special]);

        return response()->json([
            'success' => true,
            'message' => 'Status spesial menu berhasil diubah',
            'data' => [
                'id' => $menu->id,
                'is_special' => $menu->is_special,
            ],
        ]);
    }
}