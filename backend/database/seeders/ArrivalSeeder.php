<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Arrival;
use App\Models\User;
use Carbon\Carbon;

class ArrivalSeeder extends Seeder
{
    public function run(): void
    {
        $employee = User::where('phone', '081234567891')->first();

        // Phone numbers matching the members created in MemberSeeder/UserSeeder
        $phones = [
            '081234567894', // Siti (REGULAR)
            '082200001000', // Fake 1 (REGULAR)
            '082200001001', // Fake 2 (BRONZE)
            '082200001002', // Fake 3 (BRONZE)
            '081234567892', // Dhani (SILVER)
            '082200001003', // Fake 4 (SILVER)
            '082200001004', // Fake 5 (GOLD)
            '082200001005', // Fake 6 (GOLD)
        ];

        $memberIds = [];
        foreach ($phones as $phone) {
            $user = User::where('phone', $phone)->with('member')->first();
            if ($user && $user->member) {
                $memberIds[] = $user->member->id;
            }
        }

        // Create 3 active check-ins today
        if (count($memberIds) >= 3) {
            Arrival::create([
                'member_id' => $memberIds[0],
                'check_in_at' => Carbon::now()->subHours(2),
                'status' => 'active',
                'checked_in_by' => $employee->id,
            ]);
            Arrival::create([
                'member_id' => $memberIds[1],
                'check_in_at' => Carbon::now()->subHours(1),
                'status' => 'active',
                'checked_in_by' => $employee->id,
            ]);
            Arrival::create([
                'member_id' => $memberIds[2],
                'check_in_at' => Carbon::now()->subMinutes(30),
                'status' => 'active',
                'checked_in_by' => $employee->id,
            ]);
        }

        // Create historic completed arrivals (distribute to all members so they have transaction history)
        foreach ($memberIds as $index => $mId) {
            Arrival::create([
                'member_id' => $mId,
                'check_in_at' => Carbon::now()->subDays(5 + $index)->setTime(9, 0),
                'check_out_at' => Carbon::now()->subDays(5 + $index)->setTime(13, 0),
                'status' => 'completed',
                'checked_in_by' => $employee->id,
                'notes' => 'Selesai ' . ($index + 1),
            ]);
            
            // Give some members a second completed arrival
            if ($index % 2 == 0) {
                 Arrival::create([
                    'member_id' => $mId,
                    'check_in_at' => Carbon::now()->subDays(20 + $index)->setTime(10, 0),
                    'check_out_at' => Carbon::now()->subDays(20 + $index)->setTime(14, 0),
                    'status' => 'completed',
                    'checked_in_by' => $employee->id,
                ]);
            }
        }
    }
}