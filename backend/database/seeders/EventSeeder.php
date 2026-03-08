<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $events = [];

        // --- Category: Event, Status: Published ---
        $events[] = [
            'title' => 'Lomba Mancing Mania - Ongoing',
            'description' => fake()->paragraphs(5, true),
            'category' => 'event',
            'start_date' => now()->subDays(2),
            'end_date' => now()->addDays(5), // ongoing
            'status' => 'published',
            'image' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        $events[] = [
            'title' => 'Turnamen Akbar Akhir Tahun - Upcoming',
            'description' => fake()->paragraphs(6, true),
            'category' => 'event',
            'start_date' => now()->addDays(10),
            'end_date' => now()->addDays(12), // upcoming
            'status' => 'published',
            'image' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        $events[] = [
            'title' => 'Lomba Mancing Kemerdekaan - Finished',
            'description' => fake()->paragraphs(4, true),
            'category' => 'event',
            'start_date' => now()->subDays(30),
            'end_date' => now()->subDays(28), // finished
            'status' => 'published',
            'image' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // --- Category: Info, Status: Published ---
        $events[] = [
            'title' => 'Peraturan Baru Kolam Pancing - Active No End Date',
            'description' => fake()->paragraphs(5, true),
            'category' => 'info',
            'start_date' => now()->subDays(5),
            'end_date' => null, // active no end_date
            'status' => 'published',
            'image' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        $events[] = [
            'title' => 'Diskon Ulang Tahun Pemancingan - Active With End Date',
            'description' => fake()->paragraphs(5, true),
            'category' => 'info',
            'start_date' => now()->subDays(1),
            'end_date' => now()->addDays(14), // active with end date
            'status' => 'published',
            'image' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        $events[] = [
            'title' => 'Promo Lebaran - Expired',
            'description' => fake()->paragraphs(4, true),
            'category' => 'info',
            'start_date' => now()->subDays(60),
            'end_date' => now()->subDays(45), // expired
            'status' => 'published',
            'image' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // --- Status: Draft ---
        $events[] = [
            'title' => 'Draft Turnamen Musim Hujan',
            'description' => fake()->paragraphs(4, true),
            'category' => 'event',
            'start_date' => now()->addDays(40),
            'end_date' => now()->addDays(42),
            'status' => 'draft',
            'image' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        $events[] = [
            'title' => 'Draft Perubahan Harga Tiket Masuk',
            'description' => fake()->paragraphs(3, true),
            'category' => 'info',
            'start_date' => null,
            'end_date' => null,
            'status' => 'draft',
            'image' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        DB::table('events')->insert($events);
    }
}