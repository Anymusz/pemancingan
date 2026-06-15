<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VoucherConfig extends Model
{
    protected $fillable = [
        'rank',
        'amount',
    ];
}
