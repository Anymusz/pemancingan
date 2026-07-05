<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class OwnerSeeder extends Seeder
{
    /**
     * Seed the real owner account.
     * Safe to re-run — uses firstOrCreate keyed on email.
     */
    public function run(): void
    {
        $password = env('OWNER_PASSWORD');

        if (app()->environment('production') && empty($password)) {
            throw new \RuntimeException(
                'OWNER_PASSWORD wajib diisi di .env untuk environment production.'
            );
        }

        User::firstOrCreate(
            ['email' => 'mochammadarx@gmail.com'],
            [
                'name'     => 'Owner',
                'phone'    => '082179863253',
                'password' => Hash::make($password ?? 'owner123'),
                'role'     => 'owner',
                'status'   => 'active',
                'address'  => 'Jl. R. Wijaya Lorong Akimar No.271, The Hok, Kec. Jambi Sel., Kota Jambi',
            ]
        );
    }
}
