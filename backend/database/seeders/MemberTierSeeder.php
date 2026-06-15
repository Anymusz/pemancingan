<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MemberTierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tiers = [
            [
                'name' => 'REGULAR',
                'min_points' => 0,
                'max_points' => 49,
                'discount_percentage' => 0.00,
            ],
            [
                'name' => 'BRONZE',
                'min_points' => 50,
                'max_points' => 399,
                'discount_percentage' => 1.00,
            ],
            [
                'name' => 'SILVER',
                'min_points' => 400,
                'max_points' => 799,
                'discount_percentage' => 3.00,
            ],
            [
                'name' => 'GOLD',
                'min_points' => 800,
                'max_points' => null,
                'discount_percentage' => 5.00,
            ],
        ];

        // ✅ IMPROVEMENT: Gunakan updateOrCreate untuk idempotency
        foreach ($tiers as $tier) {
            DB::table('member_tiers')->updateOrInsert(
                ['name' => $tier['name']],
                array_merge($tier, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}