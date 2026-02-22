<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\Arrival;
use App\Models\Menu;
use App\Models\PendingOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PendingOrderController extends Controller
{
    /**
     * POST /api/employee/pending-orders
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'arrival_id' => 'required|integer|exists:arrivals,id',
            'item_type' => 'required|in:menu,rental',
            'item_id' => 'required_if:item_type,menu|nullable|integer|exists:menus,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $arrival = Arrival::find($request->arrival_id);

        if ($arrival->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Arrival tidak aktif',
            ], 422);
        }

        if (!$arrival->check_in_at->isToday()) {
            return response()->json([
                'success' => false,
                'message' => 'Arrival bukan hari ini',
            ], 422);
        }

        $itemName = '';
        $unitPrice = 0;

        if ($request->item_type === 'menu') {
            $menu = Menu::whereNull('deleted_at')
                ->where('availability', 'available')
                ->find($request->item_id);

            if (!$menu) {
                return response()->json([
                    'success' => false,
                    'message' => 'Menu tidak tersedia',
                ], 422);
            }

            $itemName = $menu->name;
            $unitPrice = $menu->price;

        } elseif ($request->item_type === 'rental') {
            $itemName = 'Sewa Alat Pancing';
            $unitPrice = config('rental.fishing_rod_price');
        }

        $subtotal = $request->quantity * $unitPrice;

        $order = PendingOrder::create([
            'arrival_id' => $arrival->id,
            'item_type' => $request->item_type,
            'item_id' => $request->item_type === 'menu' ? $request->item_id : null,
            'item_name_snapshot' => $itemName,
            'quantity' => $request->quantity,
            'unit_price_snapshot' => $unitPrice,
            'subtotal' => $subtotal,
            'payment_status' => 'unpaid',
            'order_source' => 'manual',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order berhasil ditambahkan',
            'data' => [
                'order' => [
                    'id' => $order->id,
                    'item_type' => $order->item_type,
                    'name' => $order->item_name_snapshot,
                    'quantity' => $order->quantity,
                    'subtotal' => $order->subtotal,
                ],
            ],
        ], 201);
    }

    /**
     * GET /api/employee/pending-orders/{arrival_id}
     */
    public function index(int $arrivalId): JsonResponse
    {
        $arrival = Arrival::find($arrivalId);

        if (!$arrival) {
            return response()->json(['success' => false, 'message' => 'Arrival tidak ditemukan'], 404);
        }

        $orders = PendingOrder::where('arrival_id', $arrivalId)
            ->where('payment_status', 'unpaid')
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'item_type' => $o->item_type,
                'name' => $o->item_name_snapshot,
                'quantity' => $o->quantity,
                'unit_price' => $o->unit_price_snapshot,
                'subtotal' => $o->subtotal,
                'source' => $o->order_source,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'arrival_id' => $arrivalId,
                'arrival_status' => $arrival->status,
                'orders' => $orders,
                'total' => $orders->sum('subtotal'),
            ],
        ]);
    }
}