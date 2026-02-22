<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingOrder extends Model
{
    protected $fillable = [
        'arrival_id',
        'item_type',
        'item_id',
        'item_name_snapshot',
        'quantity',
        'unit_price_snapshot',
        'subtotal',
        'payment_status',
        'order_source',
        'created_by',
        'transaction_id',
    ];

    protected $casts = [
        'unit_price_snapshot' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function arrival()
    {
        return $this->belongsTo(Arrival::class);
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class, 'item_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}