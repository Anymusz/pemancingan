<?php
// File: app/Models/Arrival.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Arrival extends Model
{
    protected $fillable = [
        'member_id',
        'guest_name',
        'deposit_amount',
        'check_in_at',
        'check_out_at',
        'status',
        'checked_in_by',
        'notes',
    ];

    protected $appends = ['is_guest', 'display_name'];

    protected $casts = [
        'check_in_at' => 'datetime',
        'check_out_at' => 'datetime',
    ];

    // ===== RELATIONSHIPS =====

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function checkedInBy()
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }

    public function transaction()
    {
        return $this->hasOne(Transaction::class);
    }

    // ===== METHODS =====

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function checkout(?string $notes = null): bool
    {
        return $this->update([
            'status' => 'completed',
            'check_out_at' => now(),
            'notes' => $notes ?? $this->notes,
        ]);
    }

    // ===== ACCESSORS =====

    public function getDurationAttribute(): string
    {
        if (!$this->check_out_at)
            return '-';

        $diff = $this->check_in_at->diffInMinutes($this->check_out_at);
        $hours = floor($diff / 60);
        $minutes = $diff % 60;

        return "{$hours} jam {$minutes} menit";
    }

    public function getIsGuestAttribute(): bool
    {
        return $this->member_id === null;
    }

    public function getDisplayNameAttribute(): string
    {
        if ($this->relationLoaded('member') && $this->member) {
            return $this->member->user->name ?? $this->guest_name ?? 'Tamu';
        }
        return $this->guest_name ?? 'Tamu';
    }
}