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
        'tier',
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
     * Get the user that owns the member.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate unique member ID with format: MBR + 8 random alphanumeric chars
     * Example: MBRX7K9P2M4, MBRA1B2C3D4
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