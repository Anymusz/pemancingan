<?php
// File: app/Models/GuestConfig.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GuestConfig extends Model
{
    protected $table = 'guest_configs';

    protected $fillable = ['deposit_amount'];

    protected $casts = [
        'deposit_amount' => 'decimal:2',
    ];

    /**
     * Get the current guest config, creating a default if none exists.
     */
    public static function current(): static
    {
        return static::first() ?? static::create(['deposit_amount' => 50000]);
    }
}
