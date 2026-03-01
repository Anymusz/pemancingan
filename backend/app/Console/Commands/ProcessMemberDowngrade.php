<?php

namespace App\Console\Commands;

use App\Models\Member;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessMemberDowngrade extends Command
{
    protected $signature = 'members:process-downgrade';

    protected $description = 'Process tier downgrade for inactive members (>180 days no transaction)';

    public function handle(): void
    {
        $members = Member::with(['tier', 'user'])
            ->whereNotNull('last_transaction_date')
            ->where('total_points', '>', 0)
            ->whereHas('tier', function ($q) {
                $q->where('name', '!=', 'REGULAR');
            })
            ->whereDate('last_transaction_date', '<=', now()->subDays(180))
            ->get();

        if ($members->isEmpty()) {
            Log::info('[Downgrade] Tidak ada member yang perlu diproses.');
            $this->info('Tidak ada member yang perlu diproses.');
            return;
        }

        $this->info("Memproses {$members->count()} member...");

        foreach ($members as $member) {
            try {
                $oldPoints = $member->total_points;
                $newPoints = max(0, $oldPoints - 10);

                $newTier = DB::table('member_tiers')
                    ->where('min_points', '<=', $newPoints)
                    ->where(function ($q) use ($newPoints) {
                        $q->where('max_points', '>=', $newPoints)
                          ->orWhereNull('max_points');
                    })
                    ->first();

                $tierChanged  = $newTier && $newTier->id !== $member->tier_id;
                $oldTierName  = $member->tier->name; // simpan sebelum update

                $member->update([
                    'total_points' => $newPoints,
                    'tier_id'      => $newTier?->id ?? $member->tier_id,
                ]);

                    if ($tierChanged) {
                        Log::info("[Downgrade] {$member->user->name} | Poin: {$oldPoints} → {$newPoints} | Tier: {$oldTierName} → {$newTier->name}");
                        $this->info("  ↓ {$member->user->name}: {$oldPoints} → {$newPoints} poin | {$oldTierName} → {$newTier->name}");
                    } else {
                    Log::info("[Downgrade] {$member->user->name} | Poin: {$oldPoints} → {$newPoints} | Tier tidak berubah");
                    $this->line("  · {$member->user->name}: {$oldPoints} → {$newPoints} poin | Tier tetap {$member->tier->name}");
                }

            } catch (\Exception $e) {
                Log::error("[Downgrade] Gagal memproses member ID {$member->id}: {$e->getMessage()}");
                $this->error("  ✗ Gagal memproses member ID {$member->id}: {$e->getMessage()}");
            }
        }

        Log::info("[Downgrade] Selesai. Total diproses: {$members->count()} member.");
        $this->info("Selesai. Total diproses: {$members->count()} member.");
    }
}
