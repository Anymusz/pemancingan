<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FishTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $fishTypes = [
            ['name' => 'Patin',  'price_per_kg' => 25000.00, 'is_active' => true],
            ['name' => 'Nila',   'price_per_kg' => 35000.00, 'is_active' => true],
            ['name' => 'Gurame', 'price_per_kg' => 60000.00, 'is_active' => true],
            ['name' => 'Bawal',  'price_per_kg' => 40000.00, 'is_active' => true],
            ['name' => 'Lele',   'price_per_kg' => 20000.00, 'is_active' => true],
        ];

        foreach ($fishTypes as $fishType) {
            DB::table('fish_types')->updateOrInsert(
                ['name' => $fishType['name']],
                array_merge($fishType, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}