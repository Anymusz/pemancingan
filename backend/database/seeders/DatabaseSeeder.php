<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Fase 1A: Master Data untuk Landing Page
        $this->call([
            MemberTierSeeder::class,
            FishTypeSeeder::class,
            FishStockSeeder::class,
            EventSeeder::class,
        ]);
    }
}