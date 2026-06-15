<?php
// File: app/Models/Event.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Event extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'category',
        'start_date',
        'end_date',
        'status',
        'image',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    protected $appends = ['image_url', 'display_status'];

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) return null;
        return Storage::disk('public')->url('events/' . $this->image);
    }

    public function getDisplayStatusAttribute(): string
    {
        if ($this->category === 'info') {
            return (!$this->end_date || today()->lte($this->end_date))
                ? 'active' : 'expired';
        }
        if (today()->lt($this->start_date)) return 'upcoming';
        if (today()->lte($this->end_date)) return 'ongoing';
        return 'finished';
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }
}
