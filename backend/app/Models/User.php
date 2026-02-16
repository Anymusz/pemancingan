<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'password',
        'address',
        'role',
        'status',
        // ✅ TAMBAHKAN 3 FIELD INI:
        'rejection_reason',
        'rejected_at',
        'rejected_by',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'rejected_at' => 'datetime',
    ];

    public function member()
    {
        return $this->hasOne(Member::class);
    }

    public function scopePendingMembers($query)
    {
        return $query->where('role', 'member')
                     ->where('status', 'pending');
    }

    public function scopeRejectedMembers($query)
    {
        return $query->where('role', 'member')
                     ->where('status', 'rejected');
    }
}