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
                'description' => 'Nasi goreng dengan telur, sosis, dan ayam suwir.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Mie Goreng Seafood',
                'price' => 18000,
                'category' => 'food',
                'availability' => 'available',
                'description' => 'Mie goreng dengan potongan cumi dan udang segar.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Indomie Rebus Telur Kornet',
                'price' => 12000,
                'category' => 'food',
                'availability' => 'unavailable',
                'description' => 'Indomie rebus soto dengan tambahan telur dan kornet.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Ayam Penyet Sambal Ijo',
                'price' => 20000,
                'category' => 'food',
                'availability' => 'available',
                'description' => 'Ayam goreng penyet dengan sambal ijo khas padang.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Kentang Goreng',
                'price' => 10000,
                'category' => 'food',
                'availability' => 'available',
                'description' => 'Kentang goreng renyah dengan saus sambal.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // Minuman
            [
                'name' => 'Teh Manis Dingin',
                'price' => 5000,
                'category' => 'beverage',
                'availability' => 'available',
                'description' => 'Es teh manis segar.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Es Jeruk Peras',
                'price' => 8000,
                'category' => 'beverage',
                'availability' => 'available',
                'description' => 'Perasan jeruk segar asli dengan es.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Kopi Kapal Api',
                'price' => 5000,
                'category' => 'beverage',
                'availability' => 'available',
                'description' => 'Kopi hitam panas.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Kopi Susu Gula Aren',
                'price' => 15000,
                'category' => 'beverage',
                'availability' => 'available',
                'description' => 'Kopi susu dengan campuran gula aren asli nipah.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Jus Alpukat',
                'price' => 12000,
                'category' => 'beverage',
                'availability' => 'unavailable',
                'description' => 'Jus alpukat manis dengan susu kental manis coklat.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}