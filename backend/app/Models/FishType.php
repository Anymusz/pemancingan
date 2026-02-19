<?php
// File: app/Models/FishType.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FishType extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'price_per_kg',
        'is_active',
    ];

    protected $casts = [
        'price_per_kg' => 'decimal:2',
        'is_active' => 'boolean',
    ];
}