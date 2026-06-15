<?php

namespace Database\Seeders;

use App\Models\RentalItem;
use Illuminate\Database\Seeder;

class RentalItemSeeder extends Seeder
{
    public function run(): void
    {
        RentalItem::firstOrCreate(
            ['name' => 'Sewa Stik Pancing'],
            [
                'price_per_unit' => 10000,
                'unit_label'     => 'per stik',
                'description'    => 'Stik pancing standar untuk disewa',
                'is_active'      => true,
            ]
        );
    }
}
