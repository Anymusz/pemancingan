<?php
// File: app/Models/Transaction.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'transaction_code',
        'arrival_id',
        'total_amount',
        'discount_tier',
        'final_amount',
        'discount_voucher',
        'tips',
        'payment_method',
        'points_earned',
        'status',
        'processed_by',
        'transaction_date',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'discount_tier' => 'decimal:2',
        'discount_voucher' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'tips' => 'decimal:2',
        'transaction_date' => 'datetime',
    ];

    public function voucher()
    {
        return $this->hasOne(Voucher::class);
    }

    public function arrival()
    {
        return $this->belongsTo(Arrival::class);
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function items()
    {
        return $this->hasMany(TransactionItem::class);
    }
}
