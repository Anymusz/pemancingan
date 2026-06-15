<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;

class NotificationService
{
    /**
     * Kirim notifikasi ke satu user.
     */
    public static function send(int $userId, string $type, string $title, string $body, array $data = []): void
    {
        Notification::create([
            'user_id' => $userId,
            'type'    => $type,
            'title'   => $title,
            'body'    => $body,
            'data'    => !empty($data) ? $data : null,
        ]);
    }

    /**
     * Kirim notifikasi ke semua user dengan role tertentu.
     */
    public static function sendToRole(string $role, string $type, string $title, string $body, array $data = []): void
    {
        $now = Carbon::now();

        $query = User::where('role', $role);
        if ($role === 'member') {
            $query->where('status', 'active');
        }
        $userIds = $query->pluck('id');

        if ($userIds->isEmpty()) {
            return;
        }

        $rows = $userIds->map(fn (int $id) => [
            'user_id'    => $id,
            'type'       => $type,
            'title'      => $title,
            'body'       => $body,
            'data'       => !empty($data) ? json_encode($data) : null,
            'is_read'    => false,
            'read_at'    => null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->toArray();

        Notification::insert($rows);
    }

    /**
     * Kirim notifikasi ke semua user dengan salah satu dari beberapa role.
     */
    public static function sendToRoles(array $roles, string $type, string $title, string $body, array $data = []): void
    {
        $now = Carbon::now();

        $userIds = User::whereIn('role', $roles)
            ->where(function ($q) {
                $q->where('status', 'active')
                  ->orWhereIn('role', ['owner', 'employee']);
            })
            ->pluck('id');

        if ($userIds->isEmpty()) {
            return;
        }

        $rows = $userIds->map(fn (int $id) => [
            'user_id'    => $id,
            'type'       => $type,
            'title'      => $title,
            'body'       => $body,
            'data'       => !empty($data) ? json_encode($data) : null,
            'is_read'    => false,
            'read_at'    => null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->toArray();

        Notification::insert($rows);
    }
}