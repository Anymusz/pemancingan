<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Menu extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'price',
        'category',
        'availability',
        'description',
        'image',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) return null;
        return Storage::disk('public')->url('menus/' . $this->image);
    }

    public function scopeAvailable($query)
    {
        return $query->where('availability', 'available');
    }

    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}