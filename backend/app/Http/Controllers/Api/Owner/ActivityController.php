<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\PendingOrder;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * GET /api/owner/activity/transactions
     * Paginated log of all processed transactions with customer and employee info.
     */
    public function transactions(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 20), 50);

        $paginator = Transaction::with(['arrival.member.user', 'processedBy'])
            ->whereHas('arrival')
            ->orderByDesc('transaction_date')
            ->paginate($perPage);

        $data = collect($paginator->items())->map(function (Transaction $trx) {
            return [
                'transaction_code'  => $trx->transaction_code,
                'transaction_date'  => $trx->transaction_date->toDateTimeString(),
                'payment_method'    => $trx->payment_method,
                'total_amount'      => (float) $trx->total_amount,
                'final_amount'      => (float) $trx->final_amount,
                'customer_name'     => $trx->arrival->display_name,
                'processed_by_name' => $trx->processedBy?->name ?? '-',
                'is_guest'          => is_null($trx->arrival->member_id),
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Log transaksi berhasil dimuat.',
            'data'    => $data,
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
            ],
        ]);
    }

    /**
     * GET /api/owner/activity/orders
     * Paginated log of member self-orders (order_source = 'self').
     */
    public function orders(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 20), 50);

        $paginator = PendingOrder::with(['arrival.member.user'])
            ->where('order_source', 'self')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $data = collect($paginator->items())->map(function (PendingOrder $order) {
            return [
                'id'                => $order->id,
                'item_name_snapshot' => $order->item_name_snapshot,
                'quantity'          => $order->quantity,
                'subtotal'          => (float) $order->subtotal,
                'production_status' => ($order->payment_status === 'paid' && $order->production_status === 'pending')
    ? 'done'
    : $order->production_status,
                'created_at'        => $order->created_at->toDateTimeString(),
                'member_name'       => $order->arrival?->member?->user?->name ?? '-',
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Log pesanan mandiri member berhasil dimuat.',
            'data'    => $data,
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
            ],
        ]);
    }
}