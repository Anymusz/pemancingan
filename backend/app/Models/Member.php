<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Member extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'member_id',
        'tier_id',
        'total_points',
        'total_fish_weight',
        'qr_code_hash',
        'last_transaction_date',
        'approved_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'total_points' => 'integer',
        'total_fish_weight' => 'decimal:2',
        'last_transaction_date' => 'datetime',
        'approved_at' => 'datetime',
    ];

    /**
     * Append virtual attributes to JSON
     *
     * @var array<int, string>
     */
    protected $appends = ['qr_code_url'];

    /**
     * Get QR code URL accessor
     *
     * @return string|null
     */
    public function getQrCodeUrlAttribute(): ?string
    {
        if (!$this->qr_code_hash) {
            return null;
        }

        return url('storage/qrcodes/' . $this->qr_code_hash . '.svg');
    }

    /**
     * Get the user that owns the member.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the tier that the member belongs to.
     */
    public function tier()
    {
        return $this->belongsTo(MemberTier::class, 'tier_id');
    }

    /**
     * Generate unique member ID with format: MBR + 8 random alphanumeric chars
     *
     * @return string
     * @throws \Exception
     */
    public static function generateMemberId(): string
    {
        $maxAttempts = 10;
        $attempt = 0;
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        while ($attempt < $maxAttempts) {
            // Generate 8 random characters
            $randomString = '';
            for ($i = 0; $i < 8; $i++) {
                $randomString .= $chars[random_int(0, strlen($chars) - 1)];
            }

            // Prefix with MBR
            $memberId = 'MBR' . $randomString;

            // Check uniqueness in database
            $exists = self::where('member_id', $memberId)->exists();

            if (!$exists) {
                return $memberId;
            }

            $attempt++;
        }

        throw new \Exception('Failed to generate unique member ID after ' . $maxAttempts . ' attempts');
    }

    /**
     * Generate UUID v4 for QR code filename
     *
     * @return string
     */
    public static function generateQRHash(): string
    {
        return Str::uuid()->toString();
    }
}