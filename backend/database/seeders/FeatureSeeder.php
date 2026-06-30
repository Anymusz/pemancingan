<?php

namespace Database\Seeders;

use App\Models\Feature;
use Illuminate\Database\Seeder;

class FeatureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $features = [
            ['slug' => 'owner.dashboard', 'name' => 'Dashboard Owner', 'group' => 'Owner', 'description' => 'Ringkasan pendapatan, stok ikan, member, dan tren harian.'],
            ['slug' => 'owner.member_validation', 'name' => 'Manajemen Member', 'group' => 'Owner', 'description' => 'Validasi, aktivasi, penolakan, dan deaktivasi member.'],
            ['slug' => 'owner.leaderboard', 'name' => 'Leaderboard Owner', 'group' => 'Owner', 'description' => 'Leaderboard dan konfigurasi voucher terkait peringkat.'],
            ['slug' => 'owner.menu_management', 'name' => 'Manajemen Menu', 'group' => 'Owner', 'description' => 'Tambah, ubah, hapus, ketersediaan, dan menu spesial.'],
            ['slug' => 'owner.fish_type_management', 'name' => 'Manajemen Ikan', 'group' => 'Owner', 'description' => 'Kelola jenis ikan, status aktif, stok, restock, dan threshold.'],
            ['slug' => 'owner.event_management', 'name' => 'Event dan Informasi', 'group' => 'Owner', 'description' => 'Kelola event, informasi, publikasi, dan penghapusan konten.'],
            ['slug' => 'owner.voucher_management', 'name' => 'Voucher', 'group' => 'Owner', 'description' => 'Lihat voucher dan ubah konfigurasi voucher bulanan.'],
            ['slug' => 'owner.financial_reports', 'name' => 'Laporan Keuangan', 'group' => 'Owner', 'description' => 'Ringkasan, detail transaksi, breakdown, tren, stok, dan export laporan.'],
            ['slug' => 'owner.rental_item_management', 'name' => 'Manajemen Alat Rental', 'group' => 'Owner', 'description' => 'Tambah, ubah, hapus, dan toggle status alat rental.'],
            ['slug' => 'owner.guest_config', 'name' => 'Konfigurasi Tamu', 'group' => 'Owner', 'description' => 'Lihat dan ubah nominal deposit tamu.'],
            ['slug' => 'owner.qris_config', 'name' => 'Konfigurasi QRIS', 'group' => 'Owner', 'description' => 'Lihat dan ubah gambar serta status QRIS.'],
            ['slug' => 'owner.admin_access', 'name' => 'Kontrol Akses Admin', 'group' => 'Owner', 'description' => 'Kelola fitur yang dapat diakses oleh admin atau pegawai.'],

            ['slug' => 'employee.dashboard', 'name' => 'Dashboard Pegawai', 'group' => 'Employee', 'description' => 'Ringkasan operasional harian pegawai.'],
            ['slug' => 'employee.checkin', 'name' => 'Registrasi Kedatangan', 'group' => 'Employee', 'description' => 'Check-in member atau tamu, pencarian member, dan resolve QR.'],
            ['slug' => 'employee.arrivals', 'name' => 'Kedatangan Hari Ini', 'group' => 'Employee', 'description' => 'Lihat kedatangan hari ini dan proses check-out manual.'],
            ['slug' => 'employee.add_order', 'name' => 'Tambah Pesanan', 'group' => 'Employee', 'description' => 'Tambah pending order menu atau rental untuk kedatangan aktif.'],
            ['slug' => 'employee.pending_orders', 'name' => 'Pesanan Masuk', 'group' => 'Employee', 'description' => 'Lihat dan ubah status pending order.'],
            ['slug' => 'employee.checkout', 'name' => 'Pembayaran', 'group' => 'Employee', 'description' => 'Checkout transaksi, voucher member, bukti pembayaran, dan nota.'],
            ['slug' => 'employee.menu_availability', 'name' => 'Ketersediaan Menu', 'group' => 'Employee', 'description' => 'Lihat menu dan ubah status ketersediaan menu.'],
            ['slug' => 'employee.transaction_history', 'name' => 'Riwayat Transaksi', 'group' => 'Employee', 'description' => 'Lihat riwayat dan detail transaksi.'],
            ['slug' => 'employee.fish_stocks', 'name' => 'Stok Ikan Pegawai', 'group' => 'Employee', 'description' => 'Lihat stok ikan dari panel pegawai.'],
            ['slug' => 'employee.rental_items', 'name' => 'Alat Rental Pegawai', 'group' => 'Employee', 'description' => 'Lihat alat rental dan toggle status aktif.'],
            ['slug' => 'employee.guest_config', 'name' => 'Konfigurasi Tamu Pegawai', 'group' => 'Employee', 'description' => 'Lihat konfigurasi deposit tamu dari panel pegawai.'],
            ['slug' => 'employee.qris_config', 'name' => 'Konfigurasi QRIS Pegawai', 'group' => 'Employee', 'description' => 'Lihat konfigurasi QRIS dari panel pegawai.'],
        ];

        foreach ($features as $feature) {
            Feature::updateOrCreate(
                ['slug' => $feature['slug']],
                $feature + ['is_active' => true]
            );
        }
    }
}
