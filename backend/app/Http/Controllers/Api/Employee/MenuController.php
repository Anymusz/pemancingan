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
        $menus = Menu::orderBy('category')
            ->orderBy('name')
            ->get()->map(fn($menu) => [
                'id'           => $menu->id,
                'name'         => $menu->name,
                'price'        => $menu->price,
                'category'     => $menu->category,
                'availability' => $menu->availability,
                'image_url'    => $menu->image_url,
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

        $menu->update(['availability' => $newStatus]);

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