<?php
// File: database/seeders/MenuSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('menus')->insert([
            // Makanan
            [
                'name' => 'Nasi Goreng Spesial',
                'price' => 15000,
                'category' => 'food',
                'availability' => 'available',
                'description' => 'Nasi goreng dengan telur dan ayam',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Mie Goreng',
                'price' => 12000,
                'category' => 'food',
                'availability' => 'available',
                'description' => 'Mie goreng spesial',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Indomie Rebus',
                'price' => 10000,
                'category' => 'food',
                'availability' => 'available',
                'description' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // Minuman
            [
                'name' => 'Teh Manis',
                'price' => 5000,
                'category' => 'beverage',
                'availability' => 'available',
                'description' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Es Jeruk',
                'price' => 7000,
                'category' => 'beverage',
                'availability' => 'available',
                'description' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Kopi Hitam',
                'price' => 6000,
                'category' => 'beverage',
                'availability' => 'available',
                'description' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}