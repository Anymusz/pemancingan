<?php
// File: app/Http/Controllers/Api/Employee/TransactionController.php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\Arrival;
use App\Models\FishType;
use App\Models\FishStock;
use App\Models\PendingOrder;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Voucher;

class TransactionController extends Controller
{
    /**
     * GET /api/employee/transactions
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 10), 50);

        $query = Transaction::with(['arrival.member.user', 'processedBy', 'items'])
            ->orderBy('transaction_date', 'desc');

        if ($request->filled('date_from')) {
            $query->whereDate('transaction_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('transaction_date', '<=', $request->date_to);
        }
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }
        if ($request->filled('transaction_code')) {
            $query->where('transaction_code', 'like', '%' . $request->transaction_code . '%');
        }

        $paginator = $query->paginate($perPage);

        $data = collect($paginator->items())->map(fn (Transaction $trx) => [
            'id'                => $trx->id,
            'transaction_code'  => $trx->transaction_code,
            'customer_name'     => $trx->arrival?->display_name ?? '-',
            'member_code'       => $trx->arrival?->member?->member_id ?? '-',
            'total_amount'      => (float) $trx->total_amount,
            'discount_tier'     => (float) $trx->discount_tier,
            'discount_voucher'  => (float) $trx->discount_voucher,
            'final_amount'      => (float) $trx->final_amount,
            'tips'              => (float) $trx->tips,
            'payment_method'    => $trx->payment_method,
            'points_earned'     => $trx->points_earned,
            'is_guest'          => is_null($trx->arrival?->member_id),
            'deposit_used'      => (float) ($trx->arrival?->deposit_amount > 0 ? min($trx->arrival->deposit_amount, $trx->total_amount - $trx->discount_tier - $trx->discount_voucher) : 0),
            'deposit_change'    => (float) max(0, ($trx->arrival?->deposit_amount ?? 0) - ((float)$trx->total_amount - (float)$trx->discount_tier - (float)$trx->discount_voucher)),
            'transaction_date'  => $trx->transaction_date,
            'processed_by_name' => $trx->processedBy?->name ?? '-',
            'items'             => $trx->items->map(fn ($item) => [
                'item_type'           => $item->item_type,
                'item_name_snapshot'  => $item->item_name_snapshot,
                'quantity'            => $item->quantity,
                'unit_price_snapshot' => $item->unit_price_snapshot,
                'subtotal'            => $item->subtotal,
            ])->toArray(),
        ]);

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
     * GET /api/employee/transactions/{id}
     */
    public function show(int $id): JsonResponse
    {
        $transaction = Transaction::with(['arrival.member.user', 'items', 'processedBy'])->find($id);

        if (!$transaction) {
            return response()->json(['success' => false, 'message' => 'Transaksi tidak ditemukan'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'transaction' => [
                    'transaction_code' => $transaction->transaction_code,
                    'customer_name'    => $transaction->arrival?->display_name ?? '-',
                    'member_code'      => $transaction->arrival?->member?->member_id ?? '-',
                    'items' => $transaction->items->map(fn($item) => [
                        'item_type' => $item->item_type,
                        'name' => $item->item_name_snapshot,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price_snapshot,
                        'subtotal' => $item->subtotal,
                    ]),
                    'total_amount' => $transaction->total_amount,
                    'discount_tier' => $transaction->discount_tier,
                    'discount_voucher' => $transaction->discount_voucher,
                    'final_amount' => $transaction->final_amount,
                    'tips' => $transaction->tips,
                    'payment_method' => $transaction->payment_method,
                    'points_earned' => $transaction->points_earned,
                    'transaction_date' => $transaction->transaction_date,
                    'processed_by' => $transaction->processedBy?->name ?? '-',
                    'notes' => $transaction->notes,
                ],
            ],
        ]);
    }

    /**
     * POST /api/employee/checkout
     */
    public function checkout(Request $request): JsonResponse
{
    $request->validate([
        'arrival_id'                  => 'required|integer|exists:arrivals,id',
        'fish_items'                  => 'nullable|array',
        'fish_items.*.item_id'        => 'required|integer|exists:fish_types,id',
        'fish_items.*.quantity'       => 'required|numeric|min:0.01',
        'penalty_items'               => 'nullable|array',
        'penalty_items.*.name'        => 'required|string|max:100',
        'penalty_items.*.quantity'    => 'required|integer|min:1',
        'penalty_items.*.unit_price'  => 'required|numeric|min:0',
        'payment_method'              => 'nullable|in:cash,transfer,qris',
        'tips'                        => 'nullable|numeric|min:0',
        'notes'                       => 'nullable|string|max:500',
    ]);

    try {
        DB::beginTransaction();

        // Step 1: Validate arrival
        $arrival = Arrival::find($request->arrival_id);

        if (!$arrival) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Data kedatangan tidak ditemukan'], 404);
        }

        if ($arrival->status !== 'active') {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Member sudah check-out.'], 422);
        }

        // Step 2: Determine if guest
        $isGuest = $arrival->is_guest;

        // For member arrivals, validate member is active
        $member = null;
        if (!$isGuest) {
            $member = \App\Models\Member::with('user')->find($arrival->member_id);

            if (!$member || $member->user->status !== 'active') {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Member tidak aktif'], 422);
            }
        }

        // Step 3: Fetch pending orders (menu + rental) milik arrival
        $pendingOrders = PendingOrder::where('arrival_id', $arrival->id)
            ->where('payment_status', 'unpaid')
            ->get();

        $fishItems    = $request->fish_items ?? [];
        $penaltyItems = $request->penalty_items ?? [];

        if (empty($fishItems) && $pendingOrders->isEmpty() && empty($penaltyItems)) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Tidak ada item untuk di-checkout'], 422);
        }

        // Step 4: Tier & voucher (member only)
        $currentTier  = null;
        $tierDiscount = 0;
        $activeVoucher = null;

        if (!$isGuest) {
            $currentTier = DB::table('member_tiers')
                ->where('min_points', '<=', $member->total_points)
                ->where(function ($q) use ($member) {
                    $q->whereNull('max_points')
                      ->orWhere('max_points', '>=', $member->total_points);
                })
                ->first();
            $tierDiscount = $currentTier?->discount_percentage ?? 0;

            $activeVoucher = Voucher::where('member_id', $member->id)
                ->where('status', 'unused')
                ->orderBy('issued_at', 'asc')
                ->first();
        }

        // Step 5: Generate transaction code
        $codeIdentifier = $isGuest
            ? ('G' . str_pad($arrival->id, 4, '0', STR_PAD_LEFT))
            : str_pad($arrival->member_id, 4, '0', STR_PAD_LEFT);
        $transactionCode = 'TRX-' . Carbon::now()->format('Ymd') . '-'
            . $codeIdentifier . '-'
            . Carbon::now()->format('His') . '-'
            . rand(100, 999);

        // Step 6: Kalkulasi
        $transactionItems = [];
        $subtotalFish     = 0;
        $subtotalPending  = 0;
        $subtotalPenalty  = 0;
        $totalFishWeight  = 0;
        $fishStockUpdates = [];

        // --- Fish items ---
        foreach ($fishItems as $item) {
            $fishType = FishType::find($item['item_id']);
            if (!$fishType) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => "Jenis ikan ID {$item['item_id']} tidak ditemukan",
                ], 422);
            }

            $subtotal      = round($item['quantity'] * $fishType->price_per_kg, 2);
            $subtotalFish  += $subtotal;
            $totalFishWeight += $item['quantity'];

            $fishStockUpdates[$fishType->id] = [
                'qty'  => ($fishStockUpdates[$fishType->id]['qty'] ?? 0) + $item['quantity'],
                'name' => $fishType->name,
            ];

            $transactionItems[] = [
                'item_type'          => 'fish',
                'item_id'            => $fishType->id,
                'item_name_snapshot' => $fishType->name,
                'quantity'           => $item['quantity'],
                'unit_price_snapshot' => $fishType->price_per_kg,
                'subtotal'           => $subtotal,
            ];
        }

        // --- Pending orders (menu + rental) ---
        foreach ($pendingOrders as $order) {
            $subtotalPending += $order->subtotal;

            $transactionItems[] = [
                'item_type'           => $order->item_type,
                'item_id'             => $order->item_id,
                'item_name_snapshot'  => $order->item_name_snapshot,
                'quantity'            => $order->quantity,
                'unit_price_snapshot' => $order->unit_price_snapshot,
                'subtotal'            => $order->subtotal,
            ];
        }

        // --- Penalty items ---
        foreach ($penaltyItems as $penalty) {
            $subtotal        = $penalty['quantity'] * $penalty['unit_price'];
            $subtotalPenalty += $subtotal;

            $transactionItems[] = [
                'item_type'           => 'penalty',
                'item_id'             => null,
                'item_name_snapshot'  => $penalty['name'],
                'quantity'            => $penalty['quantity'],
                'unit_price_snapshot' => $penalty['unit_price'],
                'subtotal'            => $subtotal,
            ];
        }

        $subtotalNonFish   = $subtotalPending + $subtotalPenalty;
        $totalAmount       = $subtotalFish + $subtotalNonFish;
        $discountTier      = round($subtotalFish * ($tierDiscount / 100), 2);
        $afterTierDiscount = $totalAmount - $discountTier;

        // Terapkan voucher pada total setelah diskon tier (member only)
        $discountVoucher = 0;
        if (!$isGuest && $activeVoucher) {
            $discountVoucher = $activeVoucher->amount;
            $finalAmount     = max(0, $afterTierDiscount - $discountVoucher);
        } else {
            $finalAmount = $afterTierDiscount;
        }

        // Deposit deduction (guest)
        $deposit             = $isGuest ? (float) $arrival->deposit_amount : 0;
        $depositUsed         = min($deposit, $finalAmount);
        $depositChange       = max(0, $deposit - $finalAmount);
        $finalAmountAfterDeposit = max(0, $finalAmount - $deposit);

        $tips = $request->tips ?? 0;

        // Poin: penalty tidak ikut hitungan poin; guest selalu 0
        $pointsEarned = $isGuest ? 0 : (int) floor(($subtotalFish + $subtotalPending) / 10000);

        // Step 7: Insert transaction
        $transaction = Transaction::create([
            'transaction_code' => $transactionCode,
            'arrival_id'       => $arrival->id,
            'total_amount'     => $totalAmount,
            'discount_tier'    => $discountTier,
            'discount_voucher' => $discountVoucher,
            'final_amount'     => $finalAmountAfterDeposit,
            'tips'             => $tips,
            'payment_method'   => $request->payment_method ?? 'cash',
            'points_earned'    => $pointsEarned,
            'status'           => 'paid',
            'processed_by'     => $request->user()->id,
            'transaction_date' => Carbon::now(),
            'notes'            => $request->notes,
        ]);

        // Step 8: Insert transaction items
        foreach ($transactionItems as $itemData) {
            TransactionItem::create(array_merge(
                ['transaction_id' => $transaction->id],
                $itemData
            ));
        }

        // Step 9: Update pending orders → paid + link ke transaction
        if ($pendingOrders->isNotEmpty()) {
            PendingOrder::whereIn('id', $pendingOrders->pluck('id'))->update([
                'payment_status' => 'paid',
                'transaction_id' => $transaction->id,
            ]);
        }

        // Step 10: Validasi & update stok ikan via tabel fish_stocks
        foreach ($fishStockUpdates as $fishTypeId => $stockData) {
            $qty          = $stockData['qty'];
            $fishTypeName = $stockData['name'];

            $fishStock = FishStock::where('fish_type_id', $fishTypeId)
                ->lockForUpdate()
                ->first();

            if (!$fishStock) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => "Data stok untuk ikan {$fishTypeName} tidak ditemukan",
                ], 422);
            }

            if ($fishStock->current_stock_kg < $qty) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => "Stok ikan {$fishTypeName} tidak mencukupi. Tersedia: {$fishStock->current_stock_kg} kg, dibutuhkan: {$qty} kg",
                ], 422);
            }

            $fishStock->decrement('current_stock_kg', $qty);

            // Notifikasi: Low Stock Alert — hanya saat transisi melewati threshold
            $stockBefore = $fishStock->current_stock_kg + $qty; // stok sebelum decrement
            $stockAfter  = $fishStock->current_stock_kg;         // stok setelah decrement
            $threshold   = $fishStock->alert_threshold_kg;

            if ($threshold > 0 && $stockBefore > $threshold && $stockAfter <= $threshold) {
                NotificationService::sendToRoles(
                    ['owner', 'employee'],
                    'low_stock',
                    'Stok Ikan Menipis',
                    "Stok ikan {$fishTypeName} tinggal {$stockAfter} kg, di bawah batas {$threshold} kg.",
                    ['fish_type_id' => $fishTypeId, 'fish_type_name' => $fishTypeName, 'current_stock' => (float) $stockAfter]
                );
            }
        }

        // Step 11: Update member (points, fish weight, last_transaction_date, tier) — skip for guests
        $newPoints    = 0;
        $newFishWeight = 0;
        $tierUpgraded  = false;
        $newTier       = $currentTier;

        if (!$isGuest && $member) {
            $newPoints     = $member->total_points + $pointsEarned;
            $newFishWeight = $member->total_fish_weight + $totalFishWeight;

            $newTier = DB::table('member_tiers')
                ->where('min_points', '<=', $newPoints)
                ->where(function ($q) use ($newPoints) {
                    $q->whereNull('max_points')
                      ->orWhere('max_points', '>=', $newPoints);
                })
                ->first();

            $tierUpgraded = $newTier && $currentTier && $newTier->id !== $currentTier->id;

            $member->update([
                'total_points'          => $newPoints,
                'total_fish_weight'     => $newFishWeight,
                'last_transaction_date' => Carbon::now(),
                'tier_id'               => $newTier?->id ?? $currentTier?->id,
            ]);

            if ($tierUpgraded) {
                NotificationService::send(
                    $member->user_id,
                    'tier_upgraded',
                    'Selamat! Tier Anda Naik',
                    "Tier Anda telah naik menjadi {$newTier->name}. Nikmati benefit baru!",
                    ['new_tier' => $newTier->name]
                );
            }
        }

        // Step 12: Close arrival
        $arrival->update([
            'status'       => 'completed',
            'check_out_at' => Carbon::now(),
        ]);

        // Tandai voucher sebagai used (member only)
        if (!$isGuest && $activeVoucher) {
            $activeVoucher->update([
                'status'         => 'used',
                'used_at'        => Carbon::now(),
                'transaction_id' => $transaction->id,
            ]);
        }
        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil disimpan',
            'data'    => [
                'transaction' => [
                    'transaction_code' => $transaction->transaction_code,
                    'total_amount'     => $totalAmount,
                    'discount_tier'    => $discountTier,
                    'discount_voucher' => $discountVoucher,
                    'final_amount'     => $finalAmountAfterDeposit,
                    'deposit_used'     => $depositUsed,
                    'deposit_change'   => $depositChange,
                    'tips'             => $tips,
                    'points_earned'    => $pointsEarned,
                    'payment_method'   => $transaction->payment_method,
                ],
                'customer' => $isGuest
                    ? ['name' => $arrival->guest_name ?? 'Tamu', 'is_guest' => true]
                    : [
                        'name'         => $member->user->name,
                        'total_points' => $newPoints,
                        'current_tier' => $newTier?->name ?? 'REGULAR',
                        'fish_weight'  => $newFishWeight,
                        'is_guest'     => false,
                    ],
                'tier_upgraded' => $tierUpgraded,
                'new_tier'      => $tierUpgraded ? $newTier->name : null,
                'voucher_used'  => !$isGuest && $activeVoucher !== null,
            ],
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => 'Gagal memproses transaksi: ' . $e->getMessage(),
        ], 500);
    }
}
    /**
     * GET /api/employee/member-voucher/{memberId}
     */
    public function getMemberVoucher(int $memberId): JsonResponse
    {
        $voucher = Voucher::where('member_id', $memberId)
            ->where('status', 'unused')
            ->orderBy('issued_at', 'asc')
            ->first();

        return response()->json([
            'success' => true,
            'data'    => ['voucher' => $voucher],
        ]);
    }
}
