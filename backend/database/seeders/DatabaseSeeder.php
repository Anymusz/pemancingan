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
        $this->call([
            UserSeeder::class,
            GuestConfigSeeder::class,
            MemberTierSeeder::class,
            FishTypeSeeder::class,
            FishStockSeeder::class,
            EventSeeder::class,
            MenuSeeder::class,
            VoucherConfigSeeder::class,
            MemberSeeder::class,
            ArrivalSeeder::class,
            TransactionSeeder::class,
            TransactionItemSeeder::class,
            VoucherSeeder::class,
            NotificationSeeder::class,
            RentalItemSeeder::class,
        ]);
    }
}
