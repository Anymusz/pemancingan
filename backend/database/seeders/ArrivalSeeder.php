<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Arrival;
use App\Models\Member;
use App\Models\User;
use Carbon\Carbon;

class ArrivalSeeder extends Seeder
{
    public function run(): void
    {
        $employee = User::where('phone', '081234567891')->first();

        $dhani = Member::where('member_id', 'MBR00000001')->first();
        $siti = Member::where('member_id', 'MBR00000002')->first();

        // Dhani — arrival active hari ini (untuk testing checkout)
        Arrival::create([
            'member_id' => $dhani->id,
            'check_in_at' => Carbon::now()->subHours(2),
            'check_out_at' => null,
            'status' => 'active',
            'checked_in_by' => $employee->id,
            'notes' => null,
        ]);

        // Siti — arrival active hari ini (untuk testing checkout)
        Arrival::create([
            'member_id' => $siti->id,
            'check_in_at' => Carbon::now()->subHour(),
            'check_out_at' => null,
            'status' => 'active',
            'checked_in_by' => $employee->id,
            'notes' => null,
        ]);

        // Arrival completed (untuk testing filter di TodayArrivals)
        Arrival::create([
            'member_id' => $dhani->id,
            'check_in_at' => Carbon::yesterday()->setTime(9, 0),
            'check_out_at' => Carbon::yesterday()->setTime(13, 30),
            'status' => 'completed',
            'checked_in_by' => $employee->id,
            'notes' => 'Seeding data kemarin',
        ]);
    }
}