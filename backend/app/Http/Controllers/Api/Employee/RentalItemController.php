<?php
// File: app/Http/Controllers/Api/Employee/RentalItemController.php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\RentalItem;
use Illuminate\Http\JsonResponse;

class RentalItemController extends Controller
{
    /**
     * GET /api/employee/rental-items
     * Return hanya rental items yang aktif dan tidak soft-deleted.
     */
    public function index(): JsonResponse
    {
        $items = RentalItem::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'rental_items' => $items,
                'total'        => $items->count(),
            ],
        ]);
    }

    /**
     * PATCH /api/employee/rental-items/{id}/toggle-active
     */
    public function toggleActive(int $id): JsonResponse
    {
        $item = RentalItem::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Rental item tidak ditemukan',
            ], 404);
        }

        $item->update(['is_active' => !$item->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Status rental item berhasil diubah',
            'data'    => ['rental_item' => $item->fresh()],
        ]);
    }
}