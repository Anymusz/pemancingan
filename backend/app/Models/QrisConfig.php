<?php
// File: app/Models/QrisConfig.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class QrisConfig extends Model
{
    protected $table = 'qris_configs';

    protected $fillable = ['image'];

    protected $appends = ['image_url'];

    /**
     * Get the current QRIS config, creating a default if none exists.
     */
    public static function current(): static
    {
        return static::first() ?? static::create(['image' => null]);
    }

    /**
     * Get the public URL of the QRIS image.
     */
    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? url(Storage::url($this->image)) : null;
    }
}