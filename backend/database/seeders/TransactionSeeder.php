<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Arrival;
use App\Models\Transaction;
use App\Models\Member;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $completedArrivals = Arrival::where('status', 'completed')->get();
        if ($completedArrivals->isEmpty()) return;

        $tiers = DB::table('member_tiers')->get()->keyBy('id');

        foreach ($completedArrivals as $index => $arrival) {
            $member = Member::find($arrival->member_id);
            $tier = $tiers[$member->tier_id];
            $tierDiscount = $tier->discount_percentage ?? 0;

            $scenario = ($index % 3) + 1;
            
            $subtotalFish = 0;
            $subtotalNonFish = 0;

            if ($scenario === 1) {
                // Fish only: 2kg Nila @ 35k = 70k
                $subtotalFish = 70000;
            } elseif ($scenario === 2) {
                // Mixed 1: 2kg Lele @ 20k + Nasi Goreng 15k + Es Jeruk 8k = 63k
                $subtotalFish = 40000;
                $subtotalNonFish = 23000;
            } else {
                // Mixed 2: 3kg Gurame @ 60k + Mie 18k + Sewa Pancing 20k = 218k
                $subtotalFish = 180000;
                $subtotalNonFish = 38000;
            }

            $totalAmount = $subtotalFish + $subtotalNonFish;
            $discountTierAmount = $subtotalFish * ($tierDiscount / 100);
            
            $discountVoucher = 0;
            $finalAmount = max(0, $totalAmount - $discountTierAmount - $discountVoucher);
            
            $pointsEarned = (int) floor(($subtotalFish + $subtotalNonFish) / 10000);

            $transactionCode = 'TRX-SEED-' . str_pad($index + 1, 6, '0', STR_PAD_LEFT);

            Transaction::create([
                'transaction_code' => $transactionCode,
                'arrival_id' => $arrival->id,
                'total_amount' => $totalAmount,
                'discount_tier' => $discountTierAmount,
                'discount_voucher' => $discountVoucher,
                'final_amount' => $finalAmount,
                'tips' => 0, // tips normally 0 for seeder
                'payment_method' => fake()->randomElement(['cash', 'transfer', 'qris']),
                'points_earned' => $pointsEarned,
                'status' => 'paid',
                'processed_by' => $arrival->checked_in_by,
                'transaction_date' => $arrival->check_out_at,
                'notes' => 'SCENARIO_' . $scenario, 
            ]);
        }
    }
}
