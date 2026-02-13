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

        // Event 1-3: Published Events (sedang berlangsung)
        for ($i = 0; $i < 3; $i++) {
            $startDate = now()->subDays(fake()->numberBetween(5, 15));
            $events[] = [
                'title' => fake()->sentence(5),
                'description' => fake()->paragraphs(3, true),
                'category' => 'event',
                'start_date' => $startDate,
                'end_date' => $startDate->copy()->addDays(fake()->numberBetween(7, 30)),
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Event 4-5: Published Events (upcoming)
        for ($i = 0; $i < 2; $i++) {
            $startDate = now()->addDays(fake()->numberBetween(5, 20));
            $events[] = [
                'title' => fake()->sentence(5),
                'description' => fake()->paragraphs(3, true),
                'category' => 'event',
                'start_date' => $startDate,
                'end_date' => $startDate->copy()->addDays(fake()->numberBetween(7, 30)),
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Info 1-3: Published General Info (tanpa tanggal)
        for ($i = 0; $i < 3; $i++) {
            $events[] = [
                'title' => fake()->sentence(4),
                'description' => fake()->paragraphs(2, true),
                'category' => 'info',
                'start_date' => null,
                'end_date' => null,
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Event & Info Draft (belum dipublish)
        for ($i = 0; $i < 2; $i++) {
            $category = fake()->randomElement(['event', 'info']);
            $startDate = $category === 'event' ? now()->addDays(fake()->numberBetween(30, 60)) : null;
            
            $events[] = [
                'title' => fake()->sentence(4),
                'description' => fake()->paragraphs(2, true),
                'category' => $category,
                'start_date' => $startDate,
                'end_date' => $startDate ? $startDate->copy()->addDays(fake()->numberBetween(7, 14)) : null,
                'status' => 'draft',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('events')->insert($events);
    }
}