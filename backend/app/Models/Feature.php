<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feature extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'group',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function adminAccesses()
    {
        return $this->hasMany(AdminFeatureAccess::class);
    }

    public function admins()
    {
        return $this->belongsToMany(User::class, 'admin_feature_accesses')
            ->withPivot(['can_view', 'can_create', 'can_update', 'can_delete', 'granted_by'])
            ->withTimestamps();
    }
}
