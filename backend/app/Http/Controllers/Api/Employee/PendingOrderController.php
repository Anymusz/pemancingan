<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\Arrival;
use App\Models\Menu;
use App\Models\PendingOrder;
use App\Models\RentalItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PendingOrderController extends Controller
{
    /**
     * GET /api/employee/pending-orders
     * Semua pending orders unpaid dari arrival active hari ini
     */
    public function all(): JsonResponse
    {
        $orders = PendingOrder::with(['arrival.member.user'])
            ->where('payment_status', 'unpaid')
            ->whereHas('arrival', function ($q) {
                $q->where('status', 'active')
                    ->whereDate('check_in_at', Carbon::today());
            })
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($o) => [
                'id'                  => $o->id,
                'arrival_id'          => $o->arrival_id,
                'customer_name'       => $o->arrival?->display_name ?? '-',
                'is_guest'            => is_null($o->arrival?->member_id),
                'item_type'           => $o->item_type,
                'item_name_snapshot'  => $o->item_name_snapshot,
                'quantity'            => $o->quantity,
                'unit_price_snapshot' => $o->unit_price_snapshot,
                'subtotal'            => $o->subtotal,
                'order_source'        => $o->order_source,
                'production_status'   => $o->production_status,
                'cancellation_reason' => $o->cancellation_reason,
                'created_at'          => $o->created_at,
            ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'orders' => $orders,
                'total'  => $orders->count(),
            ],
        ]);
    }

    /**
     * PATCH /api/employee/pending-orders/{id}/status
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status'              => 'required|in:pending,processing,done,cancelled',
            'cancellation_reason' => 'required_if:status,cancelled|nullable|string|max:255',
        ]);

        $order = PendingOrder::find($id);

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order tidak ditemukan'], 404);
        }

        if ($order->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Order yang sudah dibayar tidak dapat diubah statusnya',
            ], 422);
        }

        $order->production_status   = $request->status;
        $order->cancellation_reason = $request->status === 'cancelled' ? $request->cancellation_reason : null;
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Status order berhasil diperbarui',
            'data'    => [
                'order' => [
                    'id'                  => $order->id,
                    'production_status'   => $order->production_status,
                    'cancellation_reason' => $order->cancellation_reason,
                ],
            ],
        ]);
    }

    /**
     * POST /api/employee/pending-orders
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'arrival_id'        => 'required|integer|exists:arrivals,id',
            'items'             => 'required|array|min:1',
            'items.*.item_type' => 'required|in:menu,rental',
            'items.*.item_id'   => 'nullable|integer',
            'items.*.quantity'  => 'required|integer|min:1',
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

        $createdOrders = [];

        foreach ($request->items as $index => $item) {
            $itemName  = '';
            $unitPrice = 0;
            $itemId    = null;

            if ($item['item_type'] === 'menu') {
                if (empty($item['item_id'])) {
                    return response()->json([
                        'success' => false,
                        'message' => "items.{$index}.item_id wajib diisi untuk item_type menu",
                    ], 422);
                }

                $menu = Menu::whereNull('deleted_at')
                    ->where('availability', 'available')
                    ->find($item['item_id']);

                if (!$menu) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Menu tidak tersedia',
                    ], 422);
                }

                $itemName  = $menu->name;
                $unitPrice = $menu->price;
                $itemId    = $menu->id;

            } elseif ($item['item_type'] === 'rental') {
                if (empty($item['item_id'])) {
                    return response()->json([
                        'success' => false,
                        'message' => "items.{$index}.item_id wajib diisi untuk item_type rental",
                    ], 422);
                }

                $rentalItem = RentalItem::find($item['item_id']);

                if (!$rentalItem) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Rental item tidak ditemukan',
                    ], 422);
                }

                if (!$rentalItem->is_active) {
                    return response()->json([
                        'success' => false,
                        'message' => "Rental item '{$rentalItem->name}' tidak aktif",
                    ], 422);
                }

                $itemName  = $rentalItem->name;
                $unitPrice = $rentalItem->price_per_unit;
                $itemId    = $rentalItem->id;
            }

            $subtotal = $item['quantity'] * $unitPrice;

            $order = PendingOrder::create([
                'arrival_id'          => $arrival->id,
                'item_type'           => $item['item_type'],
                'item_id'             => $itemId,
                'item_name_snapshot'  => $itemName,
                'quantity'            => $item['quantity'],
                'unit_price_snapshot' => $unitPrice,
                'subtotal'            => $subtotal,
                'payment_status'      => 'unpaid',
                'order_source'        => 'manual',
                'created_by'          => $request->user()->id,
            ]);

            $createdOrders[] = [
                'id'        => $order->id,
                'item_type' => $order->item_type,
                'name'      => $order->item_name_snapshot,
                'quantity'  => $order->quantity,
                'subtotal'  => $order->subtotal,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Order berhasil ditambahkan',
            'data'    => [
                'orders' => $createdOrders,
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
            ->where('production_status', '!=', 'cancelled')
            ->get()
            ->map(fn($o) => [
                'id'         => $o->id,
                'item_type'  => $o->item_type,
                'name'       => $o->item_name_snapshot,
                'quantity'   => $o->quantity,
                'unit_price' => $o->unit_price_snapshot,
                'subtotal'   => $o->subtotal,
                'source'     => $o->order_source,
            ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'arrival_id'     => $arrivalId,
                'arrival_status' => $arrival->status,
                'orders'         => $orders,
                'total'          => $orders->sum('subtotal'),
            ],
        ]);
    }
}
