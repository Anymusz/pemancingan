<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LeaderboardController extends Controller
{
    /**
     * GET /api/owner/leaderboard
     */
    public function getOwnerLeaderboard(Request $request)
    {
        try {
            $limit = $request->query('limit', 100);
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
                        'name' => $member->user->name, // Full name, no masking
                        'total_fish_weight' => (float) $member->total_fish_weight,
                        'total_points' => $member->total_points,
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
            Log::error('Error getting owner leaderboard: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data leaderboard',
            ], 500);
        }
    }
}