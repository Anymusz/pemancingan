<?php

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MemberController extends Controller
{
    /**
     * GET /api/member/transactions
     */
    public function getTransactionsHistory(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user->member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile tidak ditemukan.',
            ], 404);
        }

        $memberId = $user->member->id;
        $perPage  = min((int) $request->input('per_page', 10), 50);

        $query = Transaction::with('items')
            ->whereHas('arrival', fn ($q) => $q->where('member_id', $memberId))
            ->orderByDesc('transaction_date');

        if ($request->filled('start_date')) {
            $query->whereDate('transaction_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('transaction_date', '<=', $request->end_date);
        }

        $paginator = $query->paginate($perPage);

        $data = collect($paginator->items())->map(fn (Transaction $trx) => [
            'transaction_code' => $trx->transaction_code,
            'transaction_date' => $trx->transaction_date->toDateTimeString(),
            'payment_method'   => $trx->payment_method,
            'total_amount'     => (float) $trx->total_amount,
            'discount_tier'    => (float) $trx->discount_tier,
            'discount_voucher' => (float) $trx->discount_voucher,
            'final_amount'     => (float) $trx->final_amount,
            'points_earned'    => $trx->points_earned,
            'items'            => $trx->items->map(fn ($item) => [
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
     * GET /api/member/profile
     */
    public function getProfile()
    {
        try {
            $user = Auth::user();

            if (!$user->member) {
                return response()->json([
                    'success' => false,
                    'message' => 'Member profile tidak ditemukan. Akun Anda mungkin belum divalidasi oleh owner.',
                ], 404);
            }

            $member = $user->member;
            $member->load('tier');

            $leaderboardData = $this->calculateLeaderboardRank($member);

            // Ambil tier berikutnya dari database — tidak hardcode
            $nextTier = DB::table('member_tiers')
                ->where('min_points', '>', $member->total_points)
                ->orderBy('min_points', 'asc')
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'name' => $user->name,
                        'phone' => $user->phone,
                        'email' => $user->email,
                        'address' => $user->address,
                    ],
                    'member' => [
                        'member_id' => $member->member_id,
                        'total_points' => $member->total_points,
                        'total_fish_weight' => (float) $member->total_fish_weight,
                        'last_transaction_date' => $member->last_transaction_date
                            ? $member->last_transaction_date->toISOString()
                            : null,
                        'approved_at' => $member->approved_at->toISOString(),
                        'qr_code_url' => $member->qr_code_url,
                    ],
                    'tier' => [
                        'name' => $member->tier->name,
                        'min_points' => $member->tier->min_points,
                        'max_points' => $member->tier->max_points,
                        'discount_percentage' => (float) $member->tier->discount_percentage,
                    ],
                    'next_tier' => $nextTier ? [
                        'name' => $nextTier->name,
                        'min_points' => $nextTier->min_points,
                        'points_needed' => $nextTier->min_points - $member->total_points,
                    ] : null,
                    'leaderboard' => $leaderboardData,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting member profile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data profile',
            ], 500);
        }
    }

    /**
     * Calculate member's leaderboard rank
     */
    private function calculateLeaderboardRank(Member $member): array
    {
        if ($member->total_fish_weight <= 0) {
            return [
                'rank' => null,
                'total_members_ranked' => Member::where('total_fish_weight', '>', 0)->count(),
            ];
        }

        $membersAbove = Member::where('total_fish_weight', '>', $member->total_fish_weight)->count();
        $rank = $membersAbove + 1;
        $totalRanked = Member::where('total_fish_weight', '>', 0)->count();

        return [
            'rank' => $rank,
            'total_members_ranked' => $totalRanked,
        ];
    }

    /**
     * GET /api/leaderboard
     */
    public function getLeaderboard(Request $request)
    {
        try {
            $limit = $request->query('limit', 10);
            $limit = min(max((int) $limit, 1), 100);

            $leaderboard = Member::with(['user', 'tier'])
                ->where('total_fish_weight', '>', 0)
                ->orderBy('total_fish_weight', 'desc')
                ->orderBy('id', 'asc')
                ->limit($limit)
                ->get()
                ->map(function ($member, $index) {
                    return [
                        'rank' => $index + 1,
                        'member_id' => $member->member_id,
                        'name' => $this->maskName($member->user->name),
                        'total_fish_weight' => (float) $member->total_fish_weight,
                        'tier' => $member->tier->name,
                    ];
                });

            $totalRanked = Member::where('total_fish_weight', '>', 0)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'leaderboard' => $leaderboard,
                    'meta' => [
                        'total_ranked_members' => $totalRanked,
                        'showing' => $leaderboard->count(),
                        'last_updated' => now()->toISOString(),
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting leaderboard: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data leaderboard',
            ], 500);
        }
    }

    /**
     * Mask member name for privacy
     */
    private function maskName(string $fullName): string
    {
        $nameParts = array_values(array_filter(explode(' ', trim($fullName))));
        $count = count($nameParts);

        if ($count === 0)
            return '';
        if ($count <= 2)
            return implode(' ', $nameParts);

        return $nameParts[0] . ' ' .
            $nameParts[1] . ' ' .
            strtoupper(substr($nameParts[2], 0, 1)) . '.';
    }
}
