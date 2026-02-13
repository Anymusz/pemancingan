<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FishStockSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil semua fish_type_id yang sudah ada, diurutkan berdasarkan id
        $fishTypes = DB::table('fish_types')->orderBy('id')->get();

        $stocks = [];
        
        // Threshold alert dan volume restock berdasarkan dokumentasi
        $stockConfig = [
            'Patin' => ['threshold' => 50, 'stock' => 150],
            'Nila' => ['threshold' => 25, 'stock' => 50],
            'Gurame' => ['threshold' => 10, 'stock' => 30],
            'Bawal' => ['threshold' => 5, 'stock' => 100],
            'Lele' => ['threshold' => 20, 'stock' => 50],
        ];

        foreach ($fishTypes as $fishType) {
            $config = $stockConfig[$fishType->name] ?? ['threshold' => 20, 'stock' => 50];
            
            $stocks[] = [
                'fish_type_id' => $fishType->id,
                'current_stock_kg' => $config['stock'], // Stok awal sesuai volume restock
                'alert_threshold_kg' => $config['threshold'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('fish_stocks')->insert($stocks);
    }
}