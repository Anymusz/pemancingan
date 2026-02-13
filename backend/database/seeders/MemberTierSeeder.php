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
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'BRONZE',
                'min_points' => 50,
                'max_points' => 399,
                'discount_percentage' => 1.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'SILVER',
                'min_points' => 400,
                'max_points' => 799,
                'discount_percentage' => 3.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'GOLD',
                'min_points' => 800,
                'max_points' => null, // Unlimited
                'discount_percentage' => 5.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('member_tiers')->insert($tiers);
    }
}