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
            ->get(['id', 'name', 'price', 'category', 'availability']); // semua menu + field availability

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