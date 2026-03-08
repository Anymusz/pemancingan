<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\FishType;
use App\Models\Menu;

class TransactionItemSeeder extends Seeder
{
    public function run(): void
    {
        $transactions = Transaction::all();
        
        $nila = FishType::where('name', 'Nila')->first();
        $lele = FishType::where('name', 'Lele')->first();
        $gurame = FishType::where('name', 'Gurame')->first();

        $nasiGoreng = Menu::where('name', 'Nasi Goreng Spesial')->first();
        $esJeruk = Menu::where('name', 'Es Jeruk Peras')->first();
        $mieGoreng = Menu::where('name', 'Mie Goreng Seafood')->first();

        foreach ($transactions as $trx) {
            // NOTE FOR PRODUCTION: Using `notes` as a temporary state passing mechanism
            // between seeders is functional but fragile. In case of partial execution or failure, 
            // cleared `notes` state cannot be reliably recovered. Ensure this strategy is exclusively used in seeding contexts.
            $scenario = $trx->notes;

            if ($scenario === 'SCENARIO_1') {
                TransactionItem::create([
                    'transaction_id' => $trx->id,
                    'item_type' => 'fish',
                    'item_id' => $nila->id ?? 2,
                    'item_name_snapshot' => $nila->name ?? 'Nila',
                    'quantity' => 2,
                    'unit_price_snapshot' => 35000,
                    'subtotal' => 70000,
                ]);
            } elseif ($scenario === 'SCENARIO_2') {
                TransactionItem::create([
                    'transaction_id' => $trx->id,
                    'item_type' => 'fish',
                    'item_id' => $lele->id ?? 5,
                    'item_name_snapshot' => $lele->name ?? 'Lele',
                    'quantity' => 2,
                    'unit_price_snapshot' => 20000,
                    'subtotal' => 40000,
                ]);
                TransactionItem::create([
                    'transaction_id' => $trx->id,
                    'item_type' => 'menu',
                    'item_id' => $nasiGoreng->id ?? 1,
                    'item_name_snapshot' => $nasiGoreng->name ?? 'Nasi Goreng Spesial',
                    'quantity' => 1,
                    'unit_price_snapshot' => 15000,
                    'subtotal' => 15000,
                ]);
                TransactionItem::create([
                    'transaction_id' => $trx->id,
                    'item_type' => 'menu',
                    'item_id' => $esJeruk->id ?? 7,
                    'item_name_snapshot' => $esJeruk->name ?? 'Es Jeruk Peras',
                    'quantity' => 1,
                    'unit_price_snapshot' => 8000,
                    'subtotal' => 8000,
                ]);
            } elseif ($scenario === 'SCENARIO_3') {
                TransactionItem::create([
                    'transaction_id' => $trx->id,
                    'item_type' => 'fish',
                    'item_id' => $gurame->id ?? 3,
                    'item_name_snapshot' => $gurame->name ?? 'Gurame',
                    'quantity' => 3,
                    'unit_price_snapshot' => 60000,
                    'subtotal' => 180000,
                ]);
                TransactionItem::create([
                    'transaction_id' => $trx->id,
                    'item_type' => 'menu',
                    'item_id' => $mieGoreng->id ?? 2,
                    'item_name_snapshot' => $mieGoreng->name ?? 'Mie Goreng Seafood',
                    'quantity' => 1,
                    'unit_price_snapshot' => 18000,
                    'subtotal' => 18000,
                ]);
                TransactionItem::create([
                    'transaction_id' => $trx->id,
                    'item_type' => 'rental',
                    'item_id' => null, 
                    'item_name_snapshot' => 'Sewa Pancing',
                    'quantity' => 1,
                    'unit_price_snapshot' => 20000,
                    'subtotal' => 20000,
                ]);
            }
            // Clear the notes
            $trx->update(['notes' => null]);
        }
    }
}
