<?php
// File: app/Http/Controllers/Api/Owner/ReportController.php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Exports\TransactionReportExport;
use App\Models\FishType;
use App\Models\Member;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Traits\CalculatesDiscountTier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    use CalculatesDiscountTier;

    // ==================== HELPER ====================

    /**
     * Parse period parameter and return [startDate, endDate] as Carbon instances.
     */
    private function getDateRange(Request $request): array
    {
        $period = $request->input('period', 'daily');

        switch ($period) {
            case 'weekly':
                $start = Carbon::now()->startOfWeek();   // Monday 00:00
                $end   = Carbon::now()->endOfWeek();     // Sunday 23:59
                break;

            case 'monthly':
                $start = Carbon::now()->startOfMonth();  // 1st 00:00
                $end   = Carbon::now()->endOfDay();      // today 23:59
                break;

            case 'custom':
                $request->validate([
                    'start_date' => 'required|date_format:Y-m-d',
                    'end_date'   => 'required|date_format:Y-m-d|after_or_equal:start_date',
                ]);
                $start = Carbon::parse($request->input('start_date'))->startOfDay();
                $end   = Carbon::parse($request->input('end_date'))->endOfDay();
                break;

            case 'daily':
            default:
                $start = Carbon::today();                // today 00:00
                $end   = Carbon::today()->endOfDay();    // today 23:59
                break;
        }

        return [$start, $end];
    }

    // ==================== ENDPOINTS ====================

    /**
     * GET /api/owner/reports/summary
     */
    public function summary(Request $request): JsonResponse
    {
        [$start, $end] = $this->getDateRange($request);

        $transactionAgg = Transaction::whereBetween('transaction_date', [$start, $end])
            ->selectRaw('
                COUNT(*)                  as total_transactions,
                COALESCE(SUM(total_amount),      0) as total_gross_revenue,
                COALESCE(SUM(discount_tier),     0) as total_discount_tier,
                COALESCE(SUM(discount_voucher),  0) as total_discount_voucher,
                COALESCE(SUM(final_amount),      0) as net_revenue,
                COALESCE(SUM(tips),              0) as total_tips
            ')
            ->first();

        $newMembers = Member::whereBetween('approved_at', [$start, $end])->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'period' => [
                    'start' => $start->toDateTimeString(),
                    'end'   => $end->toDateTimeString(),
                ],
                'total_transactions'     => (int) $transactionAgg->total_transactions,
                'total_gross_revenue'    => (float) $transactionAgg->total_gross_revenue,
                'total_discount_tier'    => (float) $transactionAgg->total_discount_tier,
                'total_discount_voucher' => (float) $transactionAgg->total_discount_voucher,
                'total_discount'         => (float) ($transactionAgg->total_discount_tier + $transactionAgg->total_discount_voucher),
                'net_revenue'            => (float) $transactionAgg->net_revenue,
                'total_tips'             => (float) $transactionAgg->total_tips,
                'new_members'            => $newMembers,
            ],
        ]);
    }

    /**
     * GET /api/owner/reports/breakdown
     */
    public function breakdown(Request $request): JsonResponse
    {
        [$start, $end] = $this->getDateRange($request);

        // --- Breakdown per kategori (item_type) ---
        $categoryBreakdown = TransactionItem::join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->whereBetween('transactions.transaction_date', [$start, $end])
            ->select(
                'transaction_items.item_type',
                DB::raw('COALESCE(SUM(transaction_items.subtotal), 0) as total_subtotal'),
                DB::raw("COALESCE(SUM(CASE WHEN transaction_items.item_type = 'fish' THEN transaction_items.quantity ELSE 0 END), 0) as total_weight_kg")
            )
            ->groupBy('transaction_items.item_type')
            ->get()
            ->map(function ($row) {
                $data = [
                    'item_type'      => $row->item_type,
                    'total_subtotal' => (float) $row->total_subtotal,
                ];
                if ($row->item_type === 'fish') {
                    $data['total_weight_kg'] = (float) $row->total_weight_kg;
                }
                return $data;
            });

        // --- Breakdown per metode pembayaran ---
        $paymentBreakdown = Transaction::whereBetween('transaction_date', [$start, $end])
            ->select(
                'payment_method',
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('COALESCE(SUM(final_amount), 0) as total_final_amount')
            )
            ->groupBy('payment_method')
            ->get()
            ->map(fn ($row) => [
                'payment_method'     => $row->payment_method,
                'total_transactions' => (int) $row->total_transactions,
                'total_final_amount' => (float) $row->total_final_amount,
            ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'period' => [
                    'start' => $start->toDateTimeString(),
                    'end'   => $end->toDateTimeString(),
                ],
                'by_category'       => $categoryBreakdown,
                'by_payment_method' => $paymentBreakdown,
            ],
        ]);
    }

    /**
     * GET /api/owner/reports/transactions
     */
    public function transactions(Request $request): JsonResponse
    {
        [$start, $end] = $this->getDateRange($request);

        $perPage = min((int) $request->input('per_page', 10), 50);

        $paginator = Transaction::with(['arrival.member.user', 'items'])
            ->whereBetween('transaction_date', [$start, $end])
            ->orderByDesc('transaction_date')
            ->paginate($perPage);

        $data = collect($paginator->items())->map(function (Transaction $trx) {
            $items = $trx->items->map(fn ($i) => $i->toArray())->toArray();

            // Apply discount_tier_item calculation
            $items = $this->calculateDiscountTierItems($items, (float) $trx->discount_tier);

            return [
                'transaction_code'  => $trx->transaction_code,
                'transaction_date'  => $trx->transaction_date->toDateTimeString(),
                'member_name'       => $trx->arrival->member->user->name ?? null,
                'total_amount'      => (float) $trx->total_amount,
                'discount_tier'     => (float) $trx->discount_tier,
                'discount_voucher'  => (float) $trx->discount_voucher,
                'final_amount'      => (float) $trx->final_amount,
                'tips'              => (float) $trx->tips,
                'payment_method'    => $trx->payment_method,
                'points_earned'     => $trx->points_earned,
                'items'             => collect($items)->map(fn ($item) => [
                    'item_type'           => $item['item_type'],
                    'item_name_snapshot'  => $item['item_name_snapshot'],
                    'quantity'            => (float) $item['quantity'],
                    'unit_price_snapshot' => (float) $item['unit_price_snapshot'],
                    'subtotal'            => (float) $item['subtotal'],
                    'discount_tier_item'  => (float) $item['discount_tier_item'],
                ])->toArray(),
            ];
        });

        return response()->json([
            'success' => true,
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
     * GET /api/owner/reports/export
     */
    public function export(Request $request)
    {
        [$start, $end] = $this->getDateRange($request);

        $transactions = Transaction::with(['arrival.member.user', 'items'])
            ->whereBetween('transaction_date', [$start, $end])
            ->orderByDesc('transaction_date')
            ->get();

        $filename = 'laporan-' . $start->format('Y-m-d') . '-' . $end->format('Y-m-d') . '.xlsx';

        return Excel::download(new TransactionReportExport($transactions, $start, $end), $filename);
    }

    /**
     * GET /api/owner/reports/stock-summary
     */
    public function stockSummary(Request $request): JsonResponse
{
    [$start, $end] = $this->getDateRange($request);

    $soldSubquery = TransactionItem::join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
        ->where('transaction_items.item_type', 'fish')
        ->whereBetween('transactions.transaction_date', [$start, $end])
        ->select('transaction_items.item_id', DB::raw('SUM(transaction_items.quantity) as total_sold'))
        ->groupBy('transaction_items.item_id');

    $restockSubquery = DB::table('restock_logs')
        ->whereBetween('created_at', [$start, $end])
        ->select('fish_type_id', DB::raw('SUM(quantity_kg) as total_restock'))
        ->groupBy('fish_type_id');

    $data = FishType::withTrashed()
        ->leftJoinSub($soldSubquery, 'sold', 'fish_types.id', '=', 'sold.item_id')
        ->leftJoinSub($restockSubquery, 'restock', 'fish_types.id', '=', 'restock.fish_type_id')
        ->leftJoin('fish_stocks', 'fish_types.id', '=', 'fish_stocks.fish_type_id')
        ->select(
            'fish_types.name',
            DB::raw('COALESCE(sold.total_sold, 0) as total_sold_kg'),
            DB::raw('COALESCE(restock.total_restock, 0) as total_restock_kg'),
            DB::raw('COALESCE(fish_stocks.current_stock_kg, 0) as current_stock_kg')
        )
        ->get()
        ->map(fn ($row) => [
            'name'             => $row->name,
            'total_sold_kg'    => (float) $row->total_sold_kg,
            'total_restock_kg' => (float) $row->total_restock_kg,
            'current_stock_kg' => (float) $row->current_stock_kg,
        ]);

    return response()->json([
        'success' => true,
        'data'    => [
            'period' => [
                'start' => $start->toDateTimeString(),
                'end'   => $end->toDateTimeString(),
            ],
            'stock_summary' => $data,
        ],
    ]);
}
}