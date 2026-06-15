<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\JsonResponse;

class MenuController extends Controller
{
    /**
     * GET /api/employee/menus
     */
    public function index(): JsonResponse
    {
        $menus = Menu::orderBy('is_special', 'desc')
            ->orderBy('category')
            ->orderBy('name')
            ->get()->map(fn($menu) => [
                'id'           => $menu->id,
                'name'         => $menu->name,
                'price'        => $menu->price,
                'category'     => $menu->category,
                'availability' => $menu->availability,
                'image_url'    => $menu->image_url,
                'is_special'   => (bool) $menu->is_special,
            ]);

        return response()->json([
            'success' => true,
            'data' => $menus,
        ]);
    }

    /**
     * PATCH /api/employee/menus/{id}/availability
     */
    public function updateAvailability(int $id): JsonResponse
    {
        $menu = Menu::find($id);

        if (!$menu) {
            return response()->json([
                'success' => false,
                'message' => 'Menu tidak ditemukan',
            ], 404);
        }

        $newStatus = $menu->availability === 'available' ? 'unavailable' : 'available';

        $updateData = ['availability' => $newStatus];
        if ($newStatus === 'unavailable') {
            $updateData['is_special'] = false;
        }

        $menu->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Status ketersediaan berhasil diubah',
            'data' => [
                'id' => $menu->id,
                'availability' => $newStatus,
            ],
        ]);
    }
}