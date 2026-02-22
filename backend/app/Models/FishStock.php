<?php
// File: app/Models/FishStock.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FishStock extends Model
{
    protected $fillable = [
        'fish_type_id',
        'current_stock_kg',
        'alert_threshold_kg',
    ];

    protected $casts = [
        'current_stock_kg' => 'decimal:2',
        'alert_threshold_kg' => 'decimal:2',
    ];

    public function fishType()
    {
        return $this->belongsTo(FishType::class);
    }
}