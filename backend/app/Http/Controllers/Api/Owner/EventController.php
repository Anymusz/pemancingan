<?php
// File: app/Http/Controllers/Api/Owner/EventController.php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * GET /api/owner/events
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->boolean('include_deleted')
            ? Event::withTrashed()
            : Event::query();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $events = $query->orderBy('created_at', 'desc')->get();

        // Count summary (tanpa filter agar summary global)
        $baseQuery = $request->boolean('include_deleted')
            ? Event::withTrashed()
            : Event::query();

        $publishedCount = (clone $baseQuery)->where('status', 'published')->count();
        $draftCount = (clone $baseQuery)->where('status', 'draft')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'events' => $events,
                'total' => $publishedCount + $draftCount,
                'published_count' => $publishedCount,
                'draft_count' => $draftCount,
            ],
        ]);
    }

    /**
     * POST /api/owner/events
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'required|string',
            'category' => 'required|in:event,info',
            'start_date' => 'required_if:category,event|nullable|date|after_or_equal:today',
            'end_date' => 'required_if:category,event|nullable|date|after_or_equal:start_date',
            'status' => 'sometimes|in:draft,published',
        ]);

        try {
            $event = Event::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'category' => $validated['category'],
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'status' => $validated['status'] ?? 'draft',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Event berhasil dibuat',
                'data' => ['event' => $event],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat event',
            ], 500);
        }
    }

    /**
     * PUT /api/owner/events/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'required|string',
            'category' => 'required|in:event,info',
            'start_date' => 'required_if:category,event|nullable|date|after_or_equal:today',
            'end_date' => 'required_if:category,event|nullable|date|after_or_equal:start_date',
            'status' => 'sometimes|in:draft,published',
        ]);

        try {
            $event->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Event berhasil diperbarui',
                'data' => ['event' => $event->fresh()],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui event',
            ], 500);
        }
    }

    /**
     * PATCH /api/owner/events/{id}/publish
     */
    public function publish(Request $request, int $id): JsonResponse
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event tidak ditemukan',
            ], 404);
        }

        $request->validate([
            'status' => 'required|in:draft,published',
        ]);

        // Validasi date untuk event category saat publish
        if ($request->status === 'published' && $event->category === 'event') {
            if (!$event->start_date || !$event->end_date) {
                return response()->json([
                    'success' => false,
                    'message' => 'Event harus memiliki start_date dan end_date sebelum dipublikasikan',
                ], 422);
            }
        }

        $event->update(['status' => $request->status]);

        // Notifikasi: Event Published → kirim ke semua member aktif
        if ($request->status === 'published') {
            NotificationService::sendToRole(
                'member',
                'event_published',
                'Event Baru!',
                "Event \"{$event->title}\" telah dipublikasikan. Lihat detailnya sekarang!",
                ['event_id' => $event->id, 'event_title' => $event->title]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Status publikasi berhasil diubah',
            'data' => ['event' => $event->fresh()],
        ]);
    }

    /**
     * DELETE /api/owner/events/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $event = Event::withTrashed()->find($id);

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event tidak ditemukan',
            ], 404);
        }

        if ($event->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Event sudah dihapus sebelumnya',
            ], 400);
        }

        $event->delete();

        return response()->json([
            'success' => true,
            'message' => 'Event berhasil dihapus',
        ]);
    }
}
