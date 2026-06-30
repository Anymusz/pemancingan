<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'password',
        'address',
        'role',
        'status',
        // ✅ TAMBAHKAN 3 FIELD INI:
        'rejection_reason',
        'rejected_at',
        'deactivated_reason',
        'deactivated_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'rejected_at' => 'datetime',
        'deactivated_at' => 'datetime',
    ];

    public function member()
    {
        return $this->hasOne(Member::class);
    }

    public function featureAccesses()
    {
        return $this->hasMany(AdminFeatureAccess::class);
    }

    public function accessibleFeatures()
    {
        return $this->belongsToMany(Feature::class, 'admin_feature_accesses')
            ->withPivot(['can_view', 'can_create', 'can_update', 'can_delete', 'granted_by'])
            ->withTimestamps();
    }

    public function hasFeatureAccess(string $featureSlug, string $permission = 'view'): bool
    {
        if ($this->role === 'owner') {
            return true;
        }

        if ($this->role !== 'employee' || $this->status !== 'active') {
            return false;
        }

        $column = AdminFeatureAccess::PERMISSION_COLUMNS[$permission] ?? null;

        if (!$column) {
            return false;
        }

        return $this->featureAccesses()
            ->where($column, true)
            ->whereHas('feature', function ($query) use ($featureSlug) {
                $query->where('slug', $featureSlug)
                    ->where('is_active', true);
            })
            ->exists();
    }

    public function featureAccessPayload(): array
    {
        if ($this->role === 'owner') {
            return Feature::where('is_active', true)
                ->orderBy('group')
                ->orderBy('name')
                ->get()
                ->map(fn (Feature $feature) => [
                    'feature_id' => $feature->id,
                    'slug' => $feature->slug,
                    'name' => $feature->name,
                    'group' => $feature->group,
                    'permissions' => array_keys(AdminFeatureAccess::ACTION_PERMISSION_COLUMNS),
                    'can_create' => true,
                    'can_update' => true,
                    'can_delete' => true,
                    'source' => 'owner_bypass',
                ])
                ->values()
                ->all();
        }

        return $this->featureAccesses()
            ->with('feature')
            ->whereHas('feature', fn ($query) => $query->where('is_active', true))
            ->get()
            ->map(fn (AdminFeatureAccess $access) => [
                'feature_id' => $access->feature_id,
                'slug' => $access->feature->slug,
                'name' => $access->feature->name,
                'group' => $access->feature->group,
                'permissions' => $access->permissionList(),
                'can_create' => $access->can_create,
                'can_update' => $access->can_update,
                'can_delete' => $access->can_delete,
                'source' => 'assigned',
            ])
            ->values()
            ->all();
    }

    public function scopePendingMembers($query)
    {
        return $query->where('role', 'member')
                     ->where('status', 'pending');
    }

    public function scopeRejectedMembers($query)
    {
        return $query->where('role', 'member')
                     ->where('status', 'rejected');
    }

    public function scopeDeactivatedMembers($query)
    {
        return $query->where('role', 'member')
                     ->where('status', 'deactivated');
    }
}
