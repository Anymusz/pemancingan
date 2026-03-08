<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Member;
use Carbon\Carbon;
use App\Services\QRCodeService;
use Illuminate\Support\Str;

class MemberSeeder extends Seeder
{
    public function run(QRCodeService $qrService): void
    {
        $tiers = [
            'REGULAR' => DB::table('member_tiers')->where('name', 'REGULAR')->value('id'),
            'BRONZE'  => DB::table('member_tiers')->where('name', 'BRONZE')->value('id'),
            'SILVER'  => DB::table('member_tiers')->where('name', 'SILVER')->value('id'),
            'GOLD'    => DB::table('member_tiers')->where('name', 'GOLD')->value('id'),
        ];

        // Member configurations
        $membersData = [
            // Siti - REGULAR
            [
                'phone' => '081234567894',
                'tier' => 'REGULAR',
                'points' => 10,
                'weight' => 5.00,
                'last_trx_days_ago' => 5,
            ],
            // Fake 1 - REGULAR
            [
                'phone' => '082200001000',
                'tier' => 'REGULAR',
                'points' => 45,
                'weight' => 15.00,
                'last_trx_days_ago' => 30, // lama (testing downgrade)
            ],
            // Fake 2 - BRONZE
            [
                'phone' => '082200001001',
                'tier' => 'BRONZE',
                'points' => 150,
                'weight' => 20.00,
                'last_trx_days_ago' => 2,
            ],
            // Fake 3 - BRONZE
            [
                'phone' => '082200001002',
                'tier' => 'BRONZE',
                'points' => 350,
                'weight' => 45.00,
                'last_trx_days_ago' => 45, // lama
            ],
            // Dhani - SILVER
            [
                'phone' => '081234567892',
                'tier' => 'SILVER',
                'points' => 550,
                'weight' => 60.00,
                'last_trx_days_ago' => 10,
            ],
            // Fake 4 - SILVER
            [
                'phone' => '082200001003',
                'tier' => 'SILVER',
                'points' => 700,
                'weight' => 90.00,
                'last_trx_days_ago' => 20,
            ],
            // Fake 5 - GOLD
            [
                'phone' => '082200001004',
                'tier' => 'GOLD',
                'points' => 900,
                'weight' => 120.00,
                'last_trx_days_ago' => 1,
            ],
            // Fake 6 - GOLD
            [
                'phone' => '082200001005',
                'tier' => 'GOLD',
                'points' => 1500,
                'weight' => 180.00,
                'last_trx_days_ago' => 60, // lama
            ],
        ];

        foreach ($membersData as $data) {
            $user = User::where('phone', $data['phone'])->first();
            if ($user) {
                $member = Member::create([
                    'user_id' => $user->id,
                    'member_id' => Member::generateMemberId(),
                    'tier_id' => $tiers[$data['tier']],
                    'qr_code_hash' => Str::uuid(),
                    'total_points' => $data['points'],
                    'total_fish_weight' => $data['weight'],
                    'last_transaction_date' => Carbon::now()->subDays($data['last_trx_days_ago']),
                    'approved_at' => Carbon::now()->subDays(max($data['last_trx_days_ago'] + 10, 30)),
                ]);
                
                $qrService->generateMemberQRCodeWithHash($member, $member->qr_code_hash);
            }
        }
    }
}
