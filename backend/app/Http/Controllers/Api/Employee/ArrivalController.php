<?php
// File: app/Http/Controllers/Api/Employee/ArrivalController.php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\Arrival;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ArrivalController extends Controller
{
    /**
     * POST /api/employee/check-in
     */
    public function checkIn(Request $request): JsonResponse
    {
        $request->validate([
            'member_id' => 'required|integer|exists:members,id',
            'notes' => 'nullable|string|max:500',
        ]);

        $member = Member::with('user')->find($request->member_id);

        if ($member->user->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Member tidak aktif'], 422);
        }

        try {
            DB::beginTransaction();

            // Step 1: Auto-close arrival dari hari sebelumnya yang masih active
            Arrival::where('member_id', $request->member_id)
                ->where('status', 'active')
                ->whereDate('check_in_at', '<', Carbon::today())
                ->update([
                    'status' => 'completed',
                    'check_out_at' => Carbon::now(),
                ]);

            // Step 2: Cek apakah sudah check-in hari ini dan masih active
            $existingArrival = Arrival::where('member_id', $request->member_id)
                ->where('status', 'active')
                ->whereDate('check_in_at', Carbon::today())
                ->first();

            if ($existingArrival) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Member sudah check-in hari ini dan belum check-out',
                ], 422);
            }

            // Step 3: Buat arrival baru
            $arrival = Arrival::create([
                'member_id' => $request->member_id,
                'check_in_at' => Carbon::now(),
                'status' => 'active',
                'checked_in_by' => $request->user()->id,
                'notes' => $request->notes,
            ]);

            DB::commit();

            $tier = $member->getCurrentTier();

            return response()->json([
                'success' => true,
                'message' => 'Check-in berhasil',
                'data' => [
                    'arrival' => [
                        'id' => $arrival->id,
                        'member' => [
                            'id' => $member->id,
                            'name' => $member->user->name,
                            'member_id' => $member->member_id,
                            'tier' => $tier?->name ?? 'REGULAR',
                            'total_points' => $member->total_points,
                        ],
                        'check_in_at' => $arrival->check_in_at,
                        'status' => $arrival->status,
                    ],
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal melakukan check-in'], 500);
        }
    }

    /**
     * GET /api/employee/today-arrivals
     */
    public function todayArrivals(): JsonResponse
    {
        $arrivals = Arrival::with(['member.user'])
            ->whereDate('check_in_at', Carbon::today())
            ->orderBy('check_in_at', 'desc')
            ->get()
            ->map(function ($arrival) {
                $tier = $arrival->member->getCurrentTier();

                return [
                    'arrival_id' => $arrival->id,
                    'member_id' => $arrival->member->id,
                    'member_code' => $arrival->member->member_id,
                    'name' => $arrival->member->user->name,
                    'tier' => $tier?->name ?? 'REGULAR',
                    'discount_percentage' => $tier?->discount_percentage ?? 0,
                    'total_points' => $arrival->member->total_points,
                    'check_in_at' => $arrival->check_in_at,
                    'check_out_at' => $arrival->check_out_at,
                    'status' => $arrival->status,
                    'duration' => $arrival->duration,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'arrivals' => $arrivals,
                'total' => $arrivals->count(),
            ],
        ]);
    }

    /**
     * POST /api/employee/check-out/{arrival_id}
     */
    public function checkOut(Request $request, int $arrivalId): JsonResponse
    {
        $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        $arrival = Arrival::with('member.user')->find($arrivalId);

        if (!$arrival) {
            return response()->json(['success' => false, 'message' => 'Data kedatangan tidak ditemukan'], 404);
        }

        if ($arrival->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Member sudah check-out sebelumnya'], 422);
        }

        $arrival->checkout($request->notes);
        $arrival->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Member berhasil check-out',
            'data' => [
                'arrival' => [
                    'id' => $arrival->id,
                    'member_name' => $arrival->member->user->name,
                    'check_in_at' => $arrival->check_in_at,
                    'check_out_at' => $arrival->check_out_at,
                    'duration' => $arrival->duration,
                ],
            ],
        ]);
    }

    /**
     * GET /api/employee/search-member?query=xxx
     * Search dari semua member aktif (untuk Check-in page)
     */
    public function searchMember(Request $request): JsonResponse
    {
        $query = trim($request->input('query', ''));

        if (!$query) {
            return response()->json(['success' => true, 'data' => ['members' => []]]);
        }

        $members = Member::with('user')
            ->whereHas('user', fn($q) => $q->where('status', 'active'))
            ->where(function ($q) use ($query) {
                $q->where('member_id', 'like', "%{$query}%")
                    ->orWhereHas(
                        'user',
                        fn($q2) => $q2
                            ->where('name', 'like', "%{$query}%")
                            ->orWhere('phone', 'like', "%{$query}%")
                    );
            })
            ->limit(10)
            ->get()
            ->map(function ($member) {
                $tier = $member->getCurrentTier();

                return [
                    'id' => $member->id,
                    'name' => $member->user->name,
                    'member_id' => $member->member_id,
                    'phone' => $member->user->phone,
                    'tier' => $tier?->name ?? 'REGULAR',
                    'total_points' => $member->total_points,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => ['members' => $members],
        ]);
    }

    /**
     * GET /api/employee/search-arrival?query=xxx
     * Search dari arrival active hari ini saja (untuk Checkout page)
     */
    public function searchArrival(Request $request): JsonResponse
    {
        $query = trim($request->input('query', ''));

        if (!$query) {
            return response()->json(['success' => true, 'data' => ['arrivals' => []]]);
        }

        $arrivals = Arrival::with(['member.user'])
            ->where('status', 'active')
            ->whereDate('check_in_at', Carbon::today())
            ->where(function ($q) use ($query) {
                $q->whereHas('member', fn($q2) => $q2->where('member_id', 'like', "%{$query}%"))
                    ->orWhereHas(
                        'member.user',
                        fn($q2) => $q2
                            ->where('name', 'like', "%{$query}%")
                            ->orWhere('phone', 'like', "%{$query}%")
                    );
            })
            ->limit(10)
            ->get()
            ->map(function ($arrival) {
                $tier = $arrival->member->getCurrentTier();

                return [
                    'arrival_id' => $arrival->id,
                    'member_id' => $arrival->member->id,
                    'member_code' => $arrival->member->member_id,
                    'name' => $arrival->member->user->name,
                    'phone' => $arrival->member->user->phone,
                    'tier' => $tier?->name ?? 'REGULAR',
                    'total_points' => $arrival->member->total_points,
                    'check_in_at' => $arrival->check_in_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => ['arrivals' => $arrivals],
        ]);
    }
}