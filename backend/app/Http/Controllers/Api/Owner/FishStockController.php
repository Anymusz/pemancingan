<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\FishType;
use App\Models\RestockLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FishStockController extends Controller
{
    /**
     * GET /api/owner/fish-stocks
     */
    public function index(): JsonResponse
    {
        $fishTypes = FishType::with('stock')
            ->orderBy('name')
            ->get()
            ->map(function ($fishType) {
                $stock = $fishType->stock;

                return [
                    'id'              => $fishType->id,
                    'name'            => $fishType->name,
                    'price_per_kg'    => $fishType->price_per_kg,
                    'is_active'       => $fishType->is_active,
                    'stock'           => $stock ? [
                        'current_stock_kg'   => $stock->current_stock_kg,
                        'alert_threshold_kg' => $stock->alert_threshold_kg,
                        'is_below_threshold' => $stock->current_stock_kg < $stock->alert_threshold_kg,
                    ] : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => [
                'fish_stocks' => $fishTypes,
                'total'       => $fishTypes->count(),
            ],
        ]);
    }

    /**
     * POST /api/owner/fish-stocks/{fishTypeId}/restock
     */
    public function restock(Request $request, int $fishTypeId): JsonResponse
    {
        $fishType = FishType::find($fishTypeId);

        if (!$fishType) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis ikan tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'quantity_kg' => 'required|numeric|min:0.1',
            'notes'       => 'nullable|string',
        ]);

        $stock = $fishType->stock;

        if (!$stock) {
            return response()->json([
                'success' => false,
                'message' => 'Data stok ikan tidak ditemukan',
            ], 404);
        }

        try {
            $stockBefore = (float) $stock->current_stock_kg;
            $stockAfter  = $stockBefore + (float) $validated['quantity_kg'];
            $threshold   = (float) $stock->alert_threshold_kg;

            $fishType->restockLogs()->create([
                'quantity_kg'  => $validated['quantity_kg'],
                'stock_before' => $stockBefore,
                'stock_after'  => $stockAfter,
                'restocked_by' => Auth::id(),
                'notes'        => $validated['notes'] ?? null,
            ]);

            $stock->update(['current_stock_kg' => $stockAfter]);

            return response()->json([
                'success' => true,
                'message' => 'Stok berhasil ditambahkan',
                'data'    => [
                    'fish_type'         => $fishType->name,
                    'quantity_added_kg' => $validated['quantity_kg'],
                    'stock_before'      => $stockBefore,
                    'stock_after'       => $stockAfter,
                    'is_below_threshold' => $stockAfter < $threshold,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan restock',
            ], 500);
        }
    }

    /**
     * PATCH /api/owner/fish-stocks/{fishTypeId}/threshold
     */
    public function updateThreshold(Request $request, int $fishTypeId): JsonResponse
    {
        $fishType = FishType::find($fishTypeId);

        if (!$fishType) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis ikan tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'alert_threshold_kg' => 'required|numeric|min:0',
        ]);

        $stock = $fishType->stock;

        if (!$stock) {
            return response()->json([
                'success' => false,
                'message' => 'Data stok ikan tidak ditemukan',
            ], 404);
        }

        $stock->update(['alert_threshold_kg' => $validated['alert_threshold_kg']]);

        return response()->json([
            'success' => true,
            'message' => 'Threshold alert berhasil diperbarui',
            'data'    => [
                'fish_type'          => $fishType->name,
                'alert_threshold_kg' => $stock->fresh()->alert_threshold_kg,
            ],
        ]);
    }

    /**
     * GET /api/owner/fish-stocks/{fishTypeId}/history
     */
    public function history(int $fishTypeId): JsonResponse
    {
        $fishType = FishType::find($fishTypeId);

        if (!$fishType) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis ikan tidak ditemukan',
            ], 404);
        }

        $logs = $fishType->restockLogs()
            ->with('restockedBy:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'fish_type' => $fishType->name,
                'logs'      => $logs,
                'total'     => $logs->count(),
            ],
        ]);
    }

    /**
     * GET /api/owner/fish-stocks/history
     */
    public function allHistory(): JsonResponse
    {
        $logs = RestockLog::with(['restockedBy:id,name', 'fishType:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'logs'  => $logs,
                'total' => $logs->count(),
            ],
        ]);
    }
}
