<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VoucherConfigSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            ['rank' => 1, 'amount' => 100000],
            ['rank' => 2, 'amount' => 50000],
            ['rank' => 3, 'amount' => 20000],
        ];

        foreach ($configs as $config) {
            DB::table('voucher_configs')->updateOrInsert(
                ['rank' => $config['rank']],
                array_merge($config, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
