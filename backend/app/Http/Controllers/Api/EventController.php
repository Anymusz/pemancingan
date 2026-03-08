<?php
// File: app/Http/Controllers/Api/EventController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 6);
        $page = (int) $request->query('page', 1);

        // Query builder dengan filter kategori di level query
        $query = Event::published();

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $events = $query->get();

        // Filter expired info dari collection
        $events = $events->filter(function ($event) {
            if ($event->category === 'info') {
                return !$event->end_date || today()->lte($event->end_date);
            }
            return true;
        });

        // Sorting: ongoing → upcoming → finished → active info
        $statusOrder = [
            'ongoing' => 0,
            'upcoming' => 1,
            'finished' => 2,
            'active' => 3,
        ];

        $events = $events->sort(function ($a, $b) use ($statusOrder) {
            $orderA = $statusOrder[$a->display_status] ?? 99;
            $orderB = $statusOrder[$b->display_status] ?? 99;

            if ($orderA !== $orderB) {
                return $orderA - $orderB;
            }

            // Dalam tiap grup, sort by start_date DESC
            // Info tanpa start_date → sort by created_at DESC
            $dateA = $a->start_date ?? $a->created_at;
            $dateB = $b->start_date ?? $b->created_at;

            return $dateB <=> $dateA;
        })->values();

        $total = $events->count();
        $offset = ($page - 1) * $perPage;
        $paginatedEvents = $events->slice($offset, $perPage)->values();

        return response()->json([
            'success' => true,
            'data' => $paginatedEvents,
            'meta' => [
                'total' => $total,
                'current_page' => $page,
                'per_page' => $perPage,
                'has_more' => ($offset + $perPage) < $total,
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $event = Event::published()->find($id);

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $event,
        ]);
    }
}
