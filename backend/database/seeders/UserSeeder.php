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

        // Account 5 - Active Member
        User::create([
            'name' => 'Siti Member',
            'phone' => '081234567894',
            'email' => 'siti@pemancingan.com',
            'password' => 'password',
            'address' => 'Jl. Member No. 3, Jakarta',
            'role' => 'member',
            'status' => 'active',
        ]);

        $faker = \Faker\Factory::create('id_ID');

        // Tambahan 6 Member Aktif (Total 8 termasuk Dhani & Siti)
        for ($i = 0; $i < 6; $i++) {
            User::create([
                'name' => $faker->name,
                'phone' => '082200001' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'email' => $faker->unique()->safeEmail,
                'password' => 'password',
                'address' => $faker->address,
                'role' => 'member',
                'status' => 'active',
            ]);
        }

        // Tambahan 1 Member Pending (Total 2 termasuk Budi)
        User::create([
            'name' => $faker->name,
            'phone' => '082200002000',
            'email' => $faker->unique()->safeEmail,
            'password' => 'password',
            'address' => $faker->address,
            'role' => 'member',
            'status' => 'pending',
        ]);

        // Tambahan 1 Member Rejected (Total 1)
        User::create([
            'name' => $faker->name,
            'phone' => '082200003000',
            'email' => $faker->unique()->safeEmail,
            'password' => 'password',
            'address' => $faker->address,
            'role' => 'member',
            'status' => 'rejected',
        ]);
    }
}