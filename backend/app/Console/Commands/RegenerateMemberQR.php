<?php

namespace App\Console\Commands;

use App\Models\Member;
use App\Services\QRCodeService;
use Illuminate\Console\Command;

class RegenerateMemberQR extends Command
{
    protected $signature = 'qr:regenerate-members';

    protected $description = 'Regenerate QR codes for all existing members with updated payload format';

    public function handle(): void
    {
        $members = Member::whereNotNull('qr_code_hash')->get();

        if ($members->isEmpty()) {
            $this->info('Tidak ada member dengan QR code yang perlu di-regenerate.');
            return;
        }

        $qrService = new QRCodeService();
        $success = 0;
        $failed  = 0;

        $this->info("Memproses {$members->count()} member...");

        foreach ($members as $member) {
            try {
                // Gunakan hash yang sudah ada, hanya regenerate SVG dengan payload baru
                $qrService->generateMemberQRCodeWithHash($member, $member->qr_code_hash);
                $success++;
                $this->line("  ✓ {$member->member_id} — QR regenerated");
            } catch (\Exception $e) {
                $failed++;
                $this->error("  ✗ {$member->member_id} — {$e->getMessage()}");
            }
        }

        $this->info("Selesai. Berhasil: {$success}, Gagal: {$failed}");
    }
}
