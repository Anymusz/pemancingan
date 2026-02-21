<?php
// File: app/Http/Controllers/Api/Employee/TransactionController.php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\Arrival;
use App\Models\FishType;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TransactionController extends Controller
{
    /**
     * POST /api/employee/checkout
     */
    public function checkout(Request $request): JsonResponse
    {
        $request->validate([
            'arrival_id' => 'required|integer|exists:arrivals,id',
            'items' => 'required|array|min:1',
            'items.*.item_type' => 'required|in:fish', // Fase 3B: hanya fish
            'items.*.item_id' => 'required|integer',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,transfer,qris',
            'tips' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            DB::beginTransaction();

            // Step 1: Get & validate arrival
            $arrival = Arrival::find($request->arrival_id);

            if (!$arrival) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Data kedatangan tidak ditemukan'], 404);
            }

            if ($arrival->status !== 'active') {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Member sudah check-out. Tidak dapat memproses transaksi.'], 422);
            }

            // Step 2: Get member
            $member = \App\Models\Member::with('user')->find($arrival->member_id);

            if (!$member || $member->user->status !== 'active') {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Member tidak aktif'], 422);
            }

            // Step 3: Get tier member saat ini
            $currentTier = DB::table('member_tiers')
                ->where('min_points', '<=', $member->total_points)
                ->where('max_points', '>=', $member->total_points)
                ->first();

            $tierDiscount = $currentTier?->discount_percentage ?? 0;

            // Step 4: Generate transaction code dengan random suffix untuk hindari duplikat
            $transactionCode = 'TRX-' . Carbon::now()->format('Ymd') . '-'
                . str_pad($arrival->member_id, 4, '0', STR_PAD_LEFT) . '-'
                . Carbon::now()->format('His') . '-'
                . rand(100, 999);

            // Step 5: Loop items
            $transactionItems = [];
            $totalAmount = 0;
            $discountTier = 0;
            $totalFishWeight = 0;

            foreach ($request->items as $item) {
                // Fase 3B: hanya fish — blok ini tetap di sini jika nanti fase berkembang
                $fishType = FishType::find($item['item_id']);
                if (!$fishType) {
                    DB::rollBack();
                    return response()->json(['success' => false, 'message' => "Jenis ikan ID {$item['item_id']} tidak ditemukan"], 422);
                }

                $itemName = $fishType->name;
                $unitPrice = $fishType->price_per_kg;
                $subtotal = $item['quantity'] * $unitPrice;

                $totalAmount += $subtotal;
                $discountTier += $subtotal * ($tierDiscount / 100);
                $totalFishWeight += $item['quantity'];

                $transactionItems[] = [
                    'item_type' => $item['item_type'],
                    'item_id' => $item['item_id'],
                    'item_name_snapshot' => $itemName,
                    'quantity' => $item['quantity'],
                    'unit_price_snapshot' => $unitPrice,
                    'subtotal' => $subtotal,
                ];
            }

            $finalAmount = $totalAmount - $discountTier;
            $tips = $request->tips ?? 0;

            // Step 6: Hitung poin dari harga ASLI sebelum diskon
            $pointsEarned = (int) floor($totalAmount / 10000);

            // Step 7: Create transaction
            $transaction = Transaction::create([
                'transaction_code' => $transactionCode,
                'arrival_id' => $arrival->id,
                'total_amount' => $totalAmount,
                'discount_tier' => $discountTier,
                'final_amount' => $finalAmount,
                'tips' => $tips,
                'payment_method' => $request->payment_method,
                'points_earned' => $pointsEarned,
                'status' => 'paid',
                'processed_by' => $request->user()->id,
                'transaction_date' => Carbon::now(),
                'notes' => $request->notes,
            ]);

            // Step 8: Create transaction items
            foreach ($transactionItems as $itemData) {
                TransactionItem::create(array_merge(['transaction_id' => $transaction->id], $itemData));
            }

            // Step 9: Update member (points, fish weight, last_transaction_date)
            $newPoints = $member->total_points + $pointsEarned;
            $newFishWeight = $member->total_fish_weight + $totalFishWeight;

            $member->update([
                'total_points' => $newPoints,
                'total_fish_weight' => $newFishWeight,
                'last_transaction_date' => Carbon::now(),
            ]);

            // Step 10: Check tier upgrade
            $newTier = DB::table('member_tiers')
                ->where('min_points', '<=', $newPoints)
                ->where('max_points', '>=', $newPoints)
                ->first();

            $tierUpgraded = $newTier && $currentTier && $newTier->id !== $currentTier->id;

            // Step 11: Close arrival
            $arrival->update([
                'status' => 'completed',
                'check_out_at' => Carbon::now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil disimpan',
                'data' => [
                    'transaction' => [
                        'transaction_code' => $transaction->transaction_code,
                        'total_amount' => $totalAmount,
                        'discount_tier' => $discountTier,
                        'final_amount' => $finalAmount,
                        'tips' => $tips,
                        'points_earned' => $pointsEarned,
                        'payment_method' => $transaction->payment_method,
                    ],
                    'member' => [
                        'name' => $member->user->name,
                        'total_points' => $newPoints,
                        'current_tier' => $newTier?->name ?? 'REGULAR',
                        'fish_weight' => $newFishWeight,
                    ],
                    'tier_upgraded' => $tierUpgraded,
                    'new_tier' => $tierUpgraded ? $newTier->name : null,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal memproses transaksi'], 500);
        }
    }

    /**
     * GET /api/employee/transactions
     */
    public function index(Request $request): JsonResponse
    {
        $limit = min($request->input('limit', 20), 100);

        $query = Transaction::with(['arrival.member.user', 'processedBy'])
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
        if ($request->filled('member_id')) {
            $query->whereHas('arrival', function ($q) use ($request) {
                $q->where('member_id', $request->member_id);
            });
        }
        if ($request->filled('transaction_code')) {
            $query->where('transaction_code', 'like', '%' . $request->transaction_code . '%');
        }

        $total = $query->count();
        $transactions = $query->limit($limit)->get()->map(function ($trx) {
            return [
                'id' => $trx->id,
                'transaction_code' => $trx->transaction_code,
                'member_name' => $trx->arrival?->member?->user?->name ?? '-',
                'member_code' => $trx->arrival?->member?->member_id ?? '-',
                'final_amount' => $trx->final_amount,
                'payment_method' => $trx->payment_method,
                'transaction_date' => $trx->transaction_date,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'transactions' => $transactions,
                'total' => $total,
                'showing' => $transactions->count(),
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
                    'member' => [
                        'name' => $transaction->arrival?->member?->user?->name ?? '-',
                        'member_id' => $transaction->arrival?->member?->member_id ?? '-',
                    ],
                    'items' => $transaction->items->map(fn($item) => [
                        'item_type' => $item->item_type,
                        'name' => $item->item_name_snapshot,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price_snapshot,
                        'subtotal' => $item->subtotal,
                    ]),
                    'total_amount' => $transaction->total_amount,
                    'discount_tier' => $transaction->discount_tier,
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
}