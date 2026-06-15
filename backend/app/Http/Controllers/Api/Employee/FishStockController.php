<?php
// app/Http/Controllers/Api/Employee/FishStockController.php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\FishType;
use Illuminate\Http\JsonResponse;

class FishStockController extends Controller
{
    /**
     * GET /api/employee/fish-stocks
     */
    public function index(): JsonResponse
    {
        $fishTypes = FishType::where('is_active', true)
            ->with('stock')
            ->get();

        $data = $fishTypes->map(fn (FishType $ft) => [
            'id'                 => $ft->id,
            'name'               => $ft->name,
            'current_stock_kg'   => (float) ($ft->stock->current_stock_kg ?? 0),
            'alert_threshold_kg' => (float) ($ft->stock->alert_threshold_kg ?? 0),
            'is_below_threshold' => ($ft->stock->alert_threshold_kg ?? 0) > 0
                && ($ft->stock->current_stock_kg ?? 0) <= ($ft->stock->alert_threshold_kg ?? 0),
        ]);

        return response()->json([
            'success' => true,
            'data'    => ['fish_stocks' => $data],
        ]);
    }
}
