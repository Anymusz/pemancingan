<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;

class RentalItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'price_per_unit',
        'unit_label',
        'description',
        'image',
        'is_active',
    ];

    protected $casts = [
        'is_active'      => 'boolean',
        'price_per_unit' => 'decimal:2',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) return null;
        return Storage::disk('public')->url('rentals/' . $this->image);
    }
}
