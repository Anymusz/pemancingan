<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberTier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'min_points',
        'max_points',
        'discount_percentage',
    ];

    protected $casts = [
        'min_points' => 'integer',
        'max_points' => 'integer',
        'discount_percentage' => 'decimal:2',
    ];

    /**
     * Get all members with this tier.
     */
    public function members()
    {
        return $this->hasMany(Member::class, 'tier_id');
    }
}