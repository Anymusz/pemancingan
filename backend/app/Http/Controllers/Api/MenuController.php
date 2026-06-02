<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\JsonResponse;

class MenuController extends Controller
{
    /**
     * GET /api/menus
     * Return semua menu available (untuk member self-order & employee AddOrder)
     */
    public function index(): JsonResponse
    {
        $menus = Menu::where('availability', 'available')
            ->orderBy('is_special', 'desc')
            ->orderBy('category')
            ->orderBy('name')
            ->get()->map(fn($menu) => [
                'id'         => $menu->id,
                'name'       => $menu->name,
                'price'      => $menu->price,
                'category'   => $menu->category,
                'image_url'  => $menu->image_url,
                'is_special' => (bool) $menu->is_special,
            ]);

        return response()->json([
            'success' => true,
            'data' => $menus,
        ]);
    }

    /**
     * GET /api/special-menus
     * Return maksimal 3 menu spesial yang aktif (tanpa auth)
     */
    public function specialMenus(): JsonResponse
    {
        $menus = Menu::where('is_special', true)
            ->where('availability', 'available')
            ->get()->map(fn($menu) => [
                'id'          => $menu->id,
                'name'        => $menu->name,
                'price'       => $menu->price,
                'category'    => $menu->category,
                'description' => $menu->description,
                'image_url'   => $menu->image_url,
            ]);

        return response()->json([
            'success' => true,
            'data' => $menus,
        ]);
    }
}