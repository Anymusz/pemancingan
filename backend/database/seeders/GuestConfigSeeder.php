<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class GuestConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!\Illuminate\Support\Facades\DB::table('guest_configs')->exists()) {
            \Illuminate\Support\Facades\DB::table('guest_configs')->insert([
                'deposit_amount' => 50000,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }
    }
}