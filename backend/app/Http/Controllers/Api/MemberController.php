<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class MemberController extends Controller
{
    /**
     * GET /api/member/profile
     * Get complete member profile data
     */
    public function getProfile()
    {
        try {
            // Get authenticated user dengan eager load member & tier
            $user = Auth::user();

            // Verify user has member record
            if (!$user->member) {
                return response()->json([
                    'success' => false,
                    'message' => 'Member profile tidak ditemukan. Akun Anda mungkin belum divalidasi oleh owner.',
                ], 404);
            }

            $member = $user->member;

            $member->load('tier');

            $leaderboardData = $this->calculateLeaderboardRank($member);

            $qrCodeUrl = $member->qr_code_url;

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
                        'qr_code_url' => $qrCodeUrl,
                    ],
                    'tier' => [
                        'name' => $member->tier->name,
                        'min_points' => $member->tier->min_points,
                        'max_points' => $member->tier->max_points,
                        'discount_percentage' => (float) $member->tier->discount_percentage,
                    ],
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
     * 
     * @param Member $member
     * @return array
     */
    private function calculateLeaderboardRank(Member $member): array
    {
        if ($member->total_fish_weight <= 0) {
            return [
                'rank' => null,
                'total_members_ranked' => Member::where('total_fish_weight', '>', 0)->count(),
            ];
        }

        $membersAbove = Member::where('total_fish_weight', '>', $member->total_fish_weight)
            ->count();

        // Rank = jumlah yang di atas + 1
        $rank = $membersAbove + 1;

        // Total member yang masuk leaderboard (weight > 0)
        $totalRanked = Member::where('total_fish_weight', '>', 0)->count();

        return [
            'rank' => $rank,
            'total_members_ranked' => $totalRanked,
        ];
    }

    /**
     * GET /api/leaderboard
     * Get public leaderboard data (no auth required)
     */
    public function getLeaderboard(Request $request)
    {
        try {
            // Validate & sanitize limit parameter
            $limit = $request->query('limit', 10);
            $limit = min(max((int) $limit, 1), 100); // Clamp between 1-100

            // Get ranked members (only with fish weight > 0)
            $leaderboard = Member::with(['user', 'tier'])
                ->where('total_fish_weight', '>', 0)
                ->orderBy('total_fish_weight', 'desc')
                ->orderBy('id', 'asc') // Tie-breaker: earlier member wins
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

            // Count total ranked members
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
     *
     * - 1 word  -> full name
     * - 2 words -> full name
     * - >=3 words -> first two words + third initial
     */
    private function maskName(string $fullName): string
    {
        $nameParts = array_values(array_filter(explode(' ', trim($fullName))));
        $count = count($nameParts);

        if ($count === 0) {
            return '';
        }

        if ($count <= 2) {
            return implode(' ', $nameParts);
        }

        return $nameParts[0] . ' ' .
            $nameParts[1] . ' ' .
            strtoupper(substr($nameParts[2], 0, 1)) . '.';
    }
}