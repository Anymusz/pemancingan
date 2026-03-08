<?php

namespace App\Console\Commands;

use App\Models\Member;
use App\Models\Voucher;
use App\Models\VoucherConfig;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class IssueMonthlyVouchers extends Command
{
    protected $signature = 'vouchers:issue-monthly';

    protected $description = 'Issue monthly vouchers for top 3 leaderboard members (previous month)';

    public function handle(): void
    {
        $targetDate = now()->subMonth();
        $year  = $targetDate->year;
        $month = $targetDate->month;

        // Period lock — skip if already issued
        if (Voucher::where('period_year', $year)->where('period_month', $month)->exists()) {
            $this->warn("Voucher periode {$month}/{$year} sudah pernah diterbitkan.");
            return;
        }

        $voucherConfigs = VoucherConfig::whereIn('rank', [1, 2, 3])->get()->keyBy('rank');

        if ($voucherConfigs->isEmpty()) {
            $this->warn('Konfigurasi voucher belum diatur. Proses dibatalkan.');
            return;
        }

        $topMembers = Member::where('total_fish_weight', '>', 0)
            ->whereHas('user', fn($q) => $q->where('status', 'active'))
            ->orderBy('total_fish_weight', 'desc')
            ->limit(3)
            ->get();

        if ($topMembers->isEmpty()) {
            $this->info('Tidak ada member yang memenuhi syarat. Tidak ada voucher yang diterbitkan.');
            return;
        }

        $months    = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        $monthName = $months[$month] . ' ' . $year;
        $command   = $this;

        DB::transaction(function () use ($topMembers, $voucherConfigs, $year, $month, $monthName, $command) {
            foreach ($topMembers as $index => $member) {
                $rank   = $index + 1;
                $config = $voucherConfigs->get($rank);

                if (!$config) {
                    $command->warn("Config untuk rank {$rank} tidak ditemukan, skip.");
                    continue;
                }

                Voucher::create([
                    'member_id'    => $member->id,
                    'amount'       => $config->amount,
                    'source'       => 'leaderboard',
                    'rank'         => $rank,
                    'period_year'  => $year,
                    'period_month' => $month,
                    'status'       => 'unused',
                    'issued_at'    => now(),
                ]);

                NotificationService::send(
                    $member->user_id,
                    'voucher_issued',
                    'Voucher Baru!',
                    "Selamat! Anda mendapatkan voucher Rp " . number_format($config->amount, 0, ',', '.') . " sebagai juara {$rank} periode {$monthName}.",
                    ['amount' => $config->amount, 'rank' => $rank, 'period' => $monthName]
                );

                $command->info("Voucher rank {$rank} diterbitkan untuk member #{$member->member_id} — Rp " . number_format($config->amount, 0, ',', '.'));
            }
        });

        $this->info("Selesai. Voucher periode {$month}/{$year} berhasil diterbitkan.");
    }
}