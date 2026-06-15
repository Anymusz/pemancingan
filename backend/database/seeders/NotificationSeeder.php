<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            'owner'    => ['member_pending', 'low_stock'],
            'employee' => ['low_stock'],
            'member'   => ['tier_upgraded', 'tier_downgraded', 'voucher_issued', 'event_published'],
        ];

        $templates = [
            'member_pending' => [
                ['title' => 'Member Baru Mendaftar', 'body' => 'Member baru "Budi Santoso" menunggu validasi.'],
                ['title' => 'Member Baru Mendaftar', 'body' => 'Member baru "Siti Rahayu" menunggu validasi.'],
                ['title' => 'Member Baru Mendaftar', 'body' => 'Member baru "Agus Pratama" menunggu validasi.'],
                ['title' => 'Member Baru Mendaftar', 'body' => 'Member baru "Dewi Lestari" menunggu validasi.'],
                ['title' => 'Member Baru Mendaftar', 'body' => 'Member baru "Andi Wijaya" menunggu validasi.'],
            ],
            'low_stock' => [
                ['title' => 'Stok Ikan Menipis', 'body' => 'Stok ikan Mas tinggal 3.5 kg, di bawah batas 5 kg.', 'data' => ['fish_type_id' => 1, 'fish_type_name' => 'Mas', 'current_stock' => 3.5]],
                ['title' => 'Stok Ikan Menipis', 'body' => 'Stok ikan Nila tinggal 2 kg, di bawah batas 5 kg.', 'data' => ['fish_type_id' => 2, 'fish_type_name' => 'Nila', 'current_stock' => 2.0]],
                ['title' => 'Stok Ikan Menipis', 'body' => 'Stok ikan Lele tinggal 4.2 kg, di bawah batas 5 kg.', 'data' => ['fish_type_id' => 3, 'fish_type_name' => 'Lele', 'current_stock' => 4.2]],
                ['title' => 'Stok Ikan Menipis', 'body' => 'Stok ikan Patin tinggal 1.8 kg, di bawah batas 3 kg.', 'data' => ['fish_type_id' => 4, 'fish_type_name' => 'Patin', 'current_stock' => 1.8]],
                ['title' => 'Stok Ikan Menipis', 'body' => 'Stok ikan Bawal tinggal 0.5 kg, di bawah batas 3 kg.', 'data' => ['fish_type_id' => 5, 'fish_type_name' => 'Bawal', 'current_stock' => 0.5]],
            ],
            'tier_upgraded' => [
                ['title' => 'Selamat! Tier Anda Naik', 'body' => 'Tier Anda telah naik menjadi SILVER. Nikmati benefit baru!', 'data' => ['new_tier' => 'SILVER']],
                ['title' => 'Selamat! Tier Anda Naik', 'body' => 'Tier Anda telah naik menjadi GOLD. Nikmati benefit baru!', 'data' => ['new_tier' => 'GOLD']],
                ['title' => 'Selamat! Tier Anda Naik', 'body' => 'Tier Anda telah naik menjadi BRONZE. Nikmati benefit baru!', 'data' => ['new_tier' => 'BRONZE']],
            ],
            'tier_downgraded' => [
                ['title' => 'Tier Anda Turun', 'body' => 'Tier Anda turun dari GOLD menjadi SILVER karena tidak ada transaksi selama 180 hari.', 'data' => ['old_tier' => 'GOLD', 'new_tier' => 'SILVER']],
                ['title' => 'Tier Anda Turun', 'body' => 'Tier Anda turun dari SILVER menjadi REGULAR karena tidak ada transaksi selama 180 hari.', 'data' => ['old_tier' => 'SILVER', 'new_tier' => 'REGULAR']],
                ['title' => 'Tier Anda Turun', 'body' => 'Tier Anda turun dari BRONZE menjadi GOLD karena tidak ada transaksi selama 180 hari.', 'data' => ['old_tier' => 'BRONZE', 'new_tier' => 'GOLD']],
            ],
            'event_published' => [
                ['title' => 'Event Baru!', 'body' => 'Event "Lomba Mancing Mania 2026" telah dipublikasikan. Lihat detailnya sekarang!', 'data' => ['event_id' => 1, 'event_title' => 'Lomba Mancing Mania 2026']],
                ['title' => 'Event Baru!', 'body' => 'Event "Promo Akhir Pekan" telah dipublikasikan. Lihat detailnya sekarang!', 'data' => ['event_id' => 2, 'event_title' => 'Promo Akhir Pekan']],
                ['title' => 'Event Baru!', 'body' => 'Event "Festival Ikan Segar" telah dipublikasikan. Lihat detailnya sekarang!', 'data' => ['event_id' => 3, 'event_title' => 'Festival Ikan Segar']],
                ['title' => 'Event Baru!', 'body' => 'Event "Turnamen Memancing Berhadiah" telah dipublikasikan. Lihat detailnya sekarang!', 'data' => ['event_id' => 4, 'event_title' => 'Turnamen Memancing Berhadiah']],
            ],
            'voucher_issued' => [
                ['title' => 'Voucher Baru!', 'body' => 'Selamat! Anda mendapatkan voucher Rp 100.000 sebagai juara 1 periode Januari 2026.', 'data' => ['amount' => 100000, 'rank' => 1, 'period' => 'Januari 2026']],
                ['title' => 'Voucher Baru!', 'body' => 'Selamat! Anda mendapatkan voucher Rp 75.000 sebagai juara 2 periode Februari 2026.', 'data' => ['amount' => 75000, 'rank' => 2, 'period' => 'Februari 2026']],
                ['title' => 'Voucher Baru!', 'body' => 'Selamat! Anda mendapatkan voucher Rp 50.000 sebagai juara 3 periode Maret 2026.', 'data' => ['amount' => 50000, 'rank' => 3, 'period' => 'Maret 2026']],
            ],
        ];

        $now = Carbon::now();
        $users = User::all();

        foreach ($users as $user) {
            $role = $user->role;

            if (!isset($types[$role])) {
                continue;
            }

            $availableTypes = $types[$role];
            $rows = [];

            for ($i = 0; $i < 25; $i++) {
                $type = $availableTypes[$i % count($availableTypes)];
                $templateList = $templates[$type];
                $template = $templateList[$i % count($templateList)];

                $isRead = $i < 10; // 10 sudah dibaca, 15 belum
                $createdAt = $now->copy()->subDays(rand(0, 30))->subHours(rand(0, 23))->subMinutes(rand(0, 59));

                $rows[] = [
                    'user_id'    => $user->id,
                    'type'       => $type,
                    'title'      => $template['title'],
                    'body'       => $template['body'],
                    'data'       => isset($template['data']) ? json_encode($template['data']) : null,
                    'is_read'    => $isRead,
                    'read_at'    => $isRead ? $createdAt->copy()->addMinutes(rand(1, 120)) : null,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];
            }

            Notification::insert($rows);
        }
    }
}
