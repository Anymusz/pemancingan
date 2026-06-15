<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestockLog extends Model
{
    protected $fillable = [
        'fish_type_id',
        'quantity_kg',
        'stock_before',
        'stock_after',
        'restocked_by',
        'notes',
    ];

    protected $casts = [
        'quantity_kg' => 'decimal:2',
        'stock_before' => 'decimal:2',
        'stock_after' => 'decimal:2',
    ];

    public function fishType(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(FishType::class);
    }

    public function restockedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'restocked_by');
    }
}
