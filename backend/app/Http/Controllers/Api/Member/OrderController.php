<?php

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Controller;
use App\Models\Arrival;
use App\Models\Menu;
use App\Models\PendingOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OrderController extends Controller
{
    /**
     * GET /api/member/orders
     */
    public function getMyOrders(Request $request): JsonResponse
    {
        $member = $request->user()->member;

        if (!$member) {
            return response()->json(['success' => false, 'message' => 'Data member tidak ditemukan'], 404);
        }

        $orders = PendingOrder::whereHas('arrival', function ($q) use ($member) {
            $q->where('member_id', $member->id)
                ->where('status', 'active')
                ->whereDate('check_in_at', Carbon::today());
        })
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'item_name_snapshot' => $o->item_name_snapshot,
                'quantity' => $o->quantity,
                'unit_price_snapshot' => $o->unit_price_snapshot,
                'subtotal' => $o->subtotal,
                'payment_status' => $o->payment_status,
                'production_status' => $o->production_status,
                'cancellation_reason' => $o->cancellation_reason,
                'order_source' => $o->order_source,
                'created_at' => $o->created_at,
            ]);

        return response()->json([
            'success' => true,
            'data' => ['orders' => $orders],
        ]);
    }

    /**
     * POST /api/member/orders
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|integer|exists:menus,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $member = $request->user()->member;

        if (!$member) {
            return response()->json(['success' => false, 'message' => 'Data member tidak ditemukan'], 404);
        }

        $arrival = Arrival::where('member_id', $member->id)
            ->where('status', 'active')
            ->whereDate('check_in_at', Carbon::today())
            ->first();

        if (!$arrival) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum check-in hari ini. Silakan hubungi pegawai.',
            ], 422);
        }

        $created = [];

        $menuIds = collect($request->items)->pluck('menu_id');
        $menus = Menu::whereNull('deleted_at')
            ->where('availability', 'available')
            ->whereIn('id', $menuIds)
            ->get()
            ->keyBy('id');

        foreach ($request->items as $item) {
            if (!$menus->has($item['menu_id'])) {
                return response()->json([
                    'success' => false,
                    'message' => "Menu ID {$item['menu_id']} tidak tersedia",
                ], 422);
            }
        }

        DB::transaction(function () use ($request, $arrival, $menus, &$created) {
            foreach ($request->items as $item) {
                $menu = $menus->get($item['menu_id']);
                $qty = $item['quantity'];
                $subtotal = $qty * $menu->price;

                $order = PendingOrder::create([
                    'arrival_id' => $arrival->id,
                    'item_type' => 'menu',
                    'item_id' => $menu->id,
                    'item_name_snapshot' => $menu->name,
                    'quantity' => $qty,
                    'unit_price_snapshot' => $menu->price,
                    'subtotal' => $subtotal,
                    'payment_status' => 'unpaid',
                    'order_source' => 'self',
                    'created_by' => null,
                ]);

                $created[] = [
                    'id' => $order->id,
                    'name' => $menu->name,
                    'quantity' => $qty,
                    'subtotal' => $subtotal,
                ];
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil diterima',
            'data' => ['orders' => $created],
        ], 201);
    }
}