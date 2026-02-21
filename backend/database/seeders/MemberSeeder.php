<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Member;
use Carbon\Carbon;

class MemberSeeder extends Seeder
{
    public function run(): void
    {
        $regular = DB::table('member_tiers')->where('name', 'REGULAR')->value('id');
        $silver = DB::table('member_tiers')->where('name', 'SILVER')->value('id');

        // Dhani — SILVER tier (550 poin, 60 kg)
        $dhani = User::where('phone', '081234567892')->first();
        Member::create([
            'user_id' => $dhani->id,
            'member_id' => 'MBR00000001',
            'tier_id' => $silver,
            'qr_code_hash' => \Illuminate\Support\Str::uuid(),
            'total_points' => 550,
            'total_fish_weight' => 60.00,
            'last_transaction_date' => Carbon::now()->subDays(10),
            'approved_at' => Carbon::now()->subDays(30),
        ]);

        // Siti — REGULAR tier (10 poin, 0 kg)
        $siti = User::where('phone', '081234567894')->first();
        Member::create([
            'user_id' => $siti->id,
            'member_id' => 'MBR00000002',
            'tier_id' => $regular,
            'qr_code_hash' => \Illuminate\Support\Str::uuid(),
            'total_points' => 10,
            'total_fish_weight' => 0.00,
            'last_transaction_date' => Carbon::now()->subDays(5),
            'approved_at' => Carbon::now()->subDays(20),
        ]);
    }
}