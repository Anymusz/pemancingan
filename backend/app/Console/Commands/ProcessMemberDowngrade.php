<?php

namespace App\Console\Commands;

use App\Models\Member;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessMemberDowngrade extends Command
{
    protected $signature = 'members:process-downgrade';

    protected $description = 'Expire points after 180 days of inactivity; send H-7 warning notification once.';

    public function handle(): void
    {
        $now = now()->setTimezone('Asia/Jakarta');

        // Query: members with points > 0 and at least one transaction — no tier filter
        $members = Member::with(['user'])
            ->where('total_points', '>', 0)
            ->whereNotNull('last_transaction_date')
            ->get();

        if ($members->isEmpty()) {
            Log::info('[PointsExpiry] Tidak ada member yang perlu diproses.');
            $this->info('Tidak ada member yang perlu diproses.');
            return;
        }

        $this->info("Memproses {$members->count()} member...");

        $expiredCount = 0;
        $warnedCount  = 0;

        foreach ($members as $member) {
            try {
                $daysInactive = (int) $member->last_transaction_date
                    ->setTimezone('Asia/Jakarta')
                    ->diffInDays($now, true);

                // ── 3a: Expiry (>= 180 days inactive) ─────────────────────────
                if ($daysInactive >= 180) {
                    $oldPoints = $member->total_points;

                    // Resolve REGULAR tier via DB (covers 0 points)
                    $regularTier = DB::table('member_tiers')
                        ->where('min_points', '<=', 0)
                        ->where(function ($q) {
                            $q->where('max_points', '>=', 0)
                              ->orWhereNull('max_points');
                        })
                        ->first();

                    $member->update([
                        'total_points'            => 0,
                        'tier_id'                 => $regularTier?->id ?? $member->tier_id,
                        'points_expiry_warned_at' => null,
                    ]);

                    NotificationService::send(
                        $member->user_id,
                        'points_expired',
                        'Poin Anda Telah Hangus',
                        'Poin Anda hangus karena tidak ada transaksi selama 180 hari.',
                        ['old_points' => $oldPoints]
                    );

                    Log::info("[PointsExpiry] Poin hangus | {$member->user->name} | Poin: {$oldPoints} → 0 | Tidak aktif: {$daysInactive} hari");
                    $this->info("  💀 {$member->user->name}: {$oldPoints} poin hangus (tidak aktif {$daysInactive} hari)");
                    $expiredCount++;

                // ── 3b: H-7 Warning (>= 173 days, belum pernah diperingatkan) ─
                } elseif ($daysInactive >= 173 && is_null($member->points_expiry_warned_at)) {
                    $member->update([
                        'points_expiry_warned_at' => $now,
                    ]);

                    NotificationService::send(
                        $member->user_id,
                        'points_expiry_warning',
                        'Poin Anda Akan Segera Hangus',
                        'Poin Anda akan hangus dalam 7 hari jika tidak ada transaksi baru.',
                        ['points' => $member->total_points]
                    );

                    Log::info("[PointsExpiry] Peringatan H-7 | {$member->user->name} | Poin: {$member->total_points} | Tidak aktif: {$daysInactive} hari");
                    $this->line("  ⚠ {$member->user->name}: peringatan H-7 dikirim ({$member->total_points} poin, tidak aktif {$daysInactive} hari)");
                    $warnedCount++;
                }
                // Else: tidak memenuhi kondisi apapun — skip silently

            } catch (\Exception $e) {
                Log::error("[PointsExpiry] Gagal memproses member ID {$member->id}: {$e->getMessage()}");
                $this->error("  ✗ Gagal memproses member ID {$member->id}: {$e->getMessage()}");
            }
        }

        Log::info("[PointsExpiry] Selesai. Hangus: {$expiredCount} | Peringatan: {$warnedCount} | Total dicek: {$members->count()}");
        $this->info("Selesai. Hangus: {$expiredCount} | Peringatan: {$warnedCount} | Total dicek: {$members->count()}");
    }
}
