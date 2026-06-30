<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminFeatureAccess extends Model
{
    public const PERMISSION_COLUMNS = [
        'view' => 'can_view',
        'create' => 'can_create',
        'update' => 'can_update',
        'delete' => 'can_delete',
    ];

    public const ACTION_PERMISSION_COLUMNS = [
        'create' => 'can_create',
        'update' => 'can_update',
        'delete' => 'can_delete',
    ];

    protected $fillable = [
        'user_id',
        'feature_id',
        'can_view',
        'can_create',
        'can_update',
        'can_delete',
        'granted_by',
    ];

    protected $casts = [
        'can_view' => 'boolean',
        'can_create' => 'boolean',
        'can_update' => 'boolean',
        'can_delete' => 'boolean',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function feature()
    {
        return $this->belongsTo(Feature::class);
    }

    public function grantor()
    {
        return $this->belongsTo(User::class, 'granted_by');
    }

    public function allows(string $permission): bool
    {
        $column = self::PERMISSION_COLUMNS[$permission] ?? null;

        return $column !== null && (bool) $this->{$column};
    }

    public function permissionList(): array
    {
        return collect(self::ACTION_PERMISSION_COLUMNS)
            ->filter(fn (string $column) => (bool) $this->{$column})
            ->keys()
            ->values()
            ->all();
    }
}
