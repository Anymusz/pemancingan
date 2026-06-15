<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VoucherConfigSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('voucher_configs')->insert([
            ['rank' => 1, 'amount' => 100000, 'created_at' => now(), 'updated_at' => now()],
            ['rank' => 2, 'amount' => 50000,  'created_at' => now(), 'updated_at' => now()],
            ['rank' => 3, 'amount' => 20000,  'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
