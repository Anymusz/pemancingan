<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Essential seeders run in all environments.
     * Dev-only seeders run only when APP_ENV=local.
     */
    public function run(): void
    {
        // ── Essential — always run ────────────────────────────────
        // Order matters: FishStockSeeder depends on FishTypeSeeder.
        $this->call([
            OwnerSeeder::class,
            MemberTierSeeder::class,
            GuestConfigSeeder::class,
            VoucherConfigSeeder::class,
            FishTypeSeeder::class,
            FishStockSeeder::class,
            RentalItemSeeder::class,
        ]);

        // ── Dev-only — local environment only ─────────────────────
        if (app()->environment('local')) {
            $this->call([
                UserSeeder::class,
                MenuSeeder::class,
                MemberSeeder::class,
                ArrivalSeeder::class,
                TransactionSeeder::class,
                TransactionItemSeeder::class,
                VoucherSeeder::class,
                NotificationSeeder::class,
                EventSeeder::class,
            ]);
        }
    }
}