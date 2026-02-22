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
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'name', 'price', 'category']);

        return response()->json([
            'success' => true,
            'data' => $menus,
        ]);
    }
}