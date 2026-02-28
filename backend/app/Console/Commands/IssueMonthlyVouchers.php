<?php

namespace App\Console\Commands;

use App\Models\Member;
use App\Models\Voucher;
use App\Models\VoucherConfig;
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
            ->orderBy('total_fish_weight', 'desc')
            ->limit(3)
            ->get();

        if ($topMembers->isEmpty()) {
            $this->info('Tidak ada member yang memenuhi syarat. Tidak ada voucher yang diterbitkan.');
            return;
        }

        DB::transaction(function () use ($topMembers, $voucherConfigs, $year, $month) {
            foreach ($topMembers as $index => $member) {
                $rank   = $index + 1;
                $config = $voucherConfigs->get($rank);

                if (!$config) {
                    $this->warn("Config untuk rank {$rank} tidak ditemukan, skip.");
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

                $this->info("Voucher rank {$rank} diterbitkan untuk member #{$member->member_id} — Rp " . number_format($config->amount, 0, ',', '.'));
            }
        });

        $this->info("Selesai. Voucher periode {$month}/{$year} berhasil diterbitkan.");
    }
}