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
        $silver = DB::table('member_tiers')->where('name', 'SILVER')->value('id');
        $gold = DB::table('member_tiers')->where('name', 'GOLD')->value('id');

        $eligibleMembers = Member::whereIn('tier_id', [$silver, $gold])
            ->orderBy('total_fish_weight', 'desc')
            ->get();
            
        $configs = DB::table('voucher_configs')->get()->keyBy('rank');

        foreach ($eligibleMembers as $index => $member) {
            $currentRank = $index + 1;
            
            if ($currentRank > 3) continue;

            $amount = $configs[$currentRank]->amount ?? 0;

            Voucher::create([
                'member_id' => $member->id,
                'amount' => $amount,
                'source' => 'leaderboard',
                'rank' => $currentRank,
                'period_year' => Carbon::now()->year,
                'period_month' => Carbon::now()->month,
                'status' => 'unused',
                'issued_at' => Carbon::now()->startOfMonth(),
            ]);
            
            Voucher::create([
                'member_id' => $member->id,
                'amount' => $amount,
                'source' => 'leaderboard',
                'rank' => $currentRank,
                'period_year' => Carbon::now()->subMonth()->year,
                'period_month' => Carbon::now()->subMonth()->month,
                'status' => 'unused',
                'issued_at' => Carbon::now()->subMonth()->startOfMonth(),
            ]);
        }
    }
}
