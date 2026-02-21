<?php
// File: app/Models/TransactionItem.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionItem extends Model
{
    protected $fillable = [
        'transaction_id',
        'item_type',
        'item_id',
        'item_name_snapshot',
        'quantity',
        'unit_price_snapshot',
        'subtotal',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price_snapshot' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}