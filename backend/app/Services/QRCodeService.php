<?php

namespace App\Services;

use App\Models\Member;
use Illuminate\Support\Facades\Storage;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class QRCodeService
{
    /**
     * Generate QR code for member
     *
     * @param Member $member
     * @return string QR code hash (filename without extension)
     * @throws \Exception
     */
    public function generateMemberQRCode(Member $member): string
    {
        $qrHash = Member::generateQRHash();

        // Generate QR code dengan hash
        $this->generateMemberQRCodeWithHash($member, $qrHash);

        return $qrHash;
    }

    /**
     * Generate QR code with specific hash
     *
     * @param Member $member
     * @param string $qrHash
     * @return string QR code hash
     * @throws \Exception
     */
    public function generateMemberQRCodeWithHash(Member $member, string $qrHash): string
    {
        // Prepare QR content (structured JSON)
        $qrContent = [
            'type' => 'member',
            'member_id' => $member->member_id,
            'issued_at' => now()->toIso8601String(),
            'version' => '1.0',
        ];

        // Create folder if not exists
        $storagePath = 'qrcodes';
        if (!Storage::disk('public')->exists($storagePath)) {
            Storage::disk('public')->makeDirectory($storagePath);
        }

        // Manual SVG renderer
        $renderer = new ImageRenderer(
            new RendererStyle(300),
            new SvgImageBackEnd()
        );

        $writer = new Writer($renderer);
        $qrCode = $writer->writeString(json_encode($qrContent));

        $filename = $qrHash . '.svg';
        $path = $storagePath . '/' . $filename;

        $success = Storage::disk('public')->put($path, $qrCode);

        if (!$success) {
            throw new \Exception('Failed to save QR code to storage');
        }

        return $qrHash;
    }

    /**
     * Get QR code URL from hash
     *
     * @param string $qrHash
     * @return string Full URL to QR code image
     */
    public function getQRCodeUrl(string $qrHash): string
    {
        return Storage::disk('public')->url('qrcodes/' . $qrHash . '.svg');
    }

    /**
     * Delete QR code file
     * @param string $qrHash
     */
    public function deleteQRCode(string $qrHash): bool
    {
        $path = 'qrcodes/' . $qrHash . '.svg';

        if (Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->delete($path);
        }

        return false;
    }
}