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
                'id' => $o->id,
                'arrival_id' => $o->arrival_id,
                'member_name' => $o->arrival?->member?->user?->name ?? '-',
                'item_type' => $o->item_type,
                'item_name_snapshot' => $o->item_name_snapshot,
                'quantity' => $o->quantity,
                'unit_price_snapshot' => $o->unit_price_snapshot,
                'subtotal' => $o->subtotal,
                'order_source' => $o->order_source,
                'production_status' => $o->production_status,
                'cancellation_reason' => $o->cancellation_reason,
                'created_at' => $o->created_at,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'orders' => $orders,
                'total' => $orders->count(),
            ],
        ]);
    }

    /**
     * PATCH /api/employee/pending-orders/{id}/status
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending,done,cancelled',
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

        $order->production_status = $request->status;
        $order->cancellation_reason = $request->status === 'cancelled' ? $request->cancellation_reason : null;
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Status order berhasil diperbarui',
            'data' => [
                'order' => [
                    'id' => $order->id,
                    'production_status' => $order->production_status,
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