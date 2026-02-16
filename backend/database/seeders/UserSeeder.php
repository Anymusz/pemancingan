<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Account 1 - Owner
        User::create([
            'name' => 'Sutoyo Owner',
            'phone' => '081234567890',
            'email' => 'owner@pemancingan.com',
            'password' => 'password',
            'address' => 'Jl. Pemancingan Indah No. 1, Jambi',
            'role' => 'owner',
            'status' => 'active',
        ]);

        // Account 2 - Employee
        User::create([
            'name' => 'Raka Pegawai',
            'phone' => '081234567891',
            'email' => 'pegawai@pemancingan.com',
            'password' => 'password',
            'address' => 'Jl. Pemancingan Indah No. 2, Jakarta',
            'role' => 'employee',
            'status' => 'active',
        ]);

        // Account 3 - Active Member
        User::create([
            'name' => 'Dhani Member Aktif',
            'phone' => '081234567892',
            'email' => 'dani@pemancingan.com',
            'password' => 'password',
            'address' => 'Jl. Member No. 1, Jakarta',
            'role' => 'member',
            'status' => 'active',
        ]);

        // Account 4 - Pending Member
        User::create([
            'name' => 'Budi Member Pending',
            'phone' => '081234567893',
            'email' => 'budi@pemancingan.com',
            'password' => 'password',
            'address' => 'Jl. Member No. 2, Jakarta',
            'role' => 'member',
            'status' => 'pending',
        ]);

        // Account 5 - Member Tanpa Email
        User::create([
            'name' => 'Siti Tanpa Email',
            'phone' => '081234567894',
            'email' => null,
            'password' => 'password',
            'address' => 'Jl. Member No. 3, Jakarta',
            'role' => 'member',
            'status' => 'active',
        ]);
    }
}