<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Voucher;
use App\Models\Member;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class VoucherSeeder extends Seeder
{
    public function run(): void
    {
        $topMembers = Member::where('total_fish_weight', '>', 0)
            ->whereHas('user', fn($q) => $q->where('status', 'active'))
            ->orderBy('total_fish_weight', 'desc')
            ->orderBy('id', 'asc')
            ->limit(3)
            ->get();
            
        $configs = DB::table('voucher_configs')->get()->keyBy('rank');

        $currentDate = Carbon::now()->startOfMonth();
        $previousDate = Carbon::now()->startOfMonth()->subMonth();

        foreach ($topMembers as $index => $member) {
            $currentRank = $index + 1;
            
            if ($currentRank > 3) continue;

            $amount = $configs[$currentRank]->amount ?? 0;

            Voucher::create([
                'member_id' => $member->id,
                'amount' => $amount,
                'source' => 'leaderboard',
                'rank' => $currentRank,
                'period_year' => $currentDate->year,
                'period_month' => $currentDate->month,
                'status' => 'unused',
                'issued_at' => $currentDate,
            ]);
            
            Voucher::create([
                'member_id' => $member->id,
                'amount' => $amount,
                'source' => 'leaderboard',
                'rank' => $currentRank,
                'period_year' => $previousDate->year,
                'period_month' => $previousDate->month,
                'status' => 'unused',
                'issued_at' => $previousDate,
            ]);
        }
    }
}
