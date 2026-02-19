<?php
// File: app/Models/Menu.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Menu extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'price',
        'category',
        'availability',
        'description',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function scopeAvailable($query)
    {
        return $query->where('availability', 'available');
    }

    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}