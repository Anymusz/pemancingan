<?php

namespace App\Http\Controllers\Api\Owner;

use App\Models\MemberTier;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Member;
use App\Services\QRCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class MemberValidationController extends Controller
{
    protected $qrCodeService;

    public function __construct(QRCodeService $qrCodeService)
    {
        $this->qrCodeService = $qrCodeService;
    }

    /**
     * GET /owner/pending-members
     * List semua member yang menunggu validasi
     */
    public function getPendingMembers()
    {
        try {
            $pendingMembers = User::where('role', 'member')
                ->where('status', 'pending')
                ->orderBy('created_at', 'asc')
                ->get(['id', 'name', 'phone', 'email', 'address', 'created_at'])
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'phone' => $user->phone,
                        'email' => $user->email,
                        'address' => $user->address,
                        'registered_at' => $user->created_at->format('Y-m-d H:i:s'),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $pendingMembers,
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting pending members: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data pending members',
            ], 500);
        }
    }

    /**
     * POST /owner/approve-member
     * Approve pending member dengan transaction safety
     */
    public function approveMember(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $regularTierId = MemberTier::where('name', 'REGULAR')->value('id');

        if (!$regularTierId) {
            return response()->json([
                'success' => false,
                'message' => 'REGULAR tier not found - please seed member_tiers table',
            ], 500);
        }

        $qrHash = null;

        DB::beginTransaction();

        try {
            // 1. Get user dengan pessimistic locking
            $user = User::where('id', $request->user_id)
                ->lockForUpdate()
                ->first();

            if (!$user) {
                throw ValidationException::withMessages([
                    'user_id' => ['User tidak ditemukan'],
                ]);
            }

            // 2. Verify user status dan role
            if ($user->status !== 'pending') {
                throw ValidationException::withMessages([
                    'user_id' => ['Hanya member pending yang bisa di-approve'],
                ]);
            }

            if ($user->role !== 'member') {
                throw ValidationException::withMessages([
                    'user_id' => ['Invalid user role'],
                ]);
            }

            // 2.5. CHECK: Apakah user sudah punya member record (data inconsistency)
            $existingMember = Member::where('user_id', $user->id)->first();
            if ($existingMember) {
                throw ValidationException::withMessages([
                    'user_id' => ['User sudah memiliki member record. Data inconsistent - hubungi admin.'],
                ]);
            }

            // 3. Generate member ID
            $memberId = Member::generateMemberId();

            // 4. Generate QR hash
            $qrHash = Member::generateQRHash();

            // 5. Create temporary member object untuk generate QR content
            $tempMember = new Member([
                'member_id' => $memberId,
            ]);

            // 6. Generate QR Code file
            $this->qrCodeService->generateMemberQRCodeWithHash($tempMember, $qrHash);

            // 7. Create member record
            $member = Member::create([
                'user_id' => $user->id,
                'member_id' => $memberId,
                'tier_id' => $regularTierId,  // ✅ FIXED
                'total_points' => 0,
                'total_fish_weight' => 0.00,
                'qr_code_hash' => $qrHash,
                'approved_at' => now(),
            ]);

            // 8. Update user status to active
            $user->update([
                'status' => 'active',
            ]);

            // 9. Commit transaction
            DB::commit();

            // 10. Return success response
            return response()->json([
                'success' => true,
                'message' => 'Member berhasil divalidasi',
                'data' => [
                    'member_id' => $member->member_id,
                    'name' => $user->name,
                    'tier' => $member->tier->name,  // ✅ FIXED - via relasi
                ],
            ]);

        } catch (ValidationException $e) {
            DB::rollBack();

            // Cleanup QR file if exists
            if ($qrHash) {
                try {
                    $this->qrCodeService->deleteQRCode($qrHash);
                } catch (\Exception $cleanupError) {
                    Log::error('Failed to cleanup QR code: ' . $cleanupError->getMessage());
                }
            }

            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            DB::rollBack();

            // Cleanup QR file if exists
            if ($qrHash) {
                try {
                    $this->qrCodeService->deleteQRCode($qrHash);
                } catch (\Exception $cleanupError) {
                    Log::error('Failed to cleanup QR code: ' . $cleanupError->getMessage());
                }
            }

            Log::error('Error approving member: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal approve member: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /owner/reject-member
     * Reject pending member dengan optional reason
     */
    public function rejectMember(Request $request)
    {
        // Validasi input
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'rejection_reason' => 'required|string|min:10|max:500',
        ]);

        try {
            // Get user
            $user = User::find($request->user_id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan',
                ], 404);
            }

            // Verify status pending
            if ($user->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya member pending yang bisa ditolak',
                ], 422);
            }

            // Update user to rejected
            $user->update([
                'status' => 'rejected',
                'rejection_reason' => $request->rejection_reason,
                'rejected_at' => now(),
            ]);

            // ✅ REFRESH model dari database
            $user->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Member berhasil ditolak',
                'data' => [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'rejected_at' => $user->rejected_at->format('Y-m-d H:i:s'),
                    'rejection_reason' => $user->rejection_reason,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error rejecting member: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal reject member',
            ], 500);
        }
    }

    /**
     * POST /owner/reactivate-rejected-member
     * Ubah status rejected ke pending (untuk re-register)
     */
    public function reactivateRejectedMember(Request $request)
    {
        // Validasi input
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        try {
            // Get user
            $user = User::find($request->user_id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan',
                ], 404);
            }

            // Verify status rejected
            if ($user->status !== 'rejected') {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya member rejected yang bisa direaktivasi',
                ], 422);
            }

            // Update user to pending (clear rejection data)
            $user->update([
                'status' => 'pending',
                'rejection_reason' => null,
                'rejected_at' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Member berhasil direaktivasi untuk review ulang',
                'data' => [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'status' => $user->status,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error reactivating member: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal reaktivasi member',
            ], 500);
        }
    }

    /**
     * DELETE /owner/deactivate-member
     */
    public function deactivateMember(Request $request)
    {
        // Validasi input
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'rejection_reason' => 'required|string|max:500',
        ]);

        DB::beginTransaction();

        try {
            // Get user dengan member relationship
            $user = User::with('member')->find($request->user_id);

            if (!$user) {
                throw ValidationException::withMessages([
                    'user_id' => ['User tidak ditemukan'],
                ]);
            }

            if ($user->status !== 'active') {
                throw ValidationException::withMessages([
                    'user_id' => ['Hanya member aktif yang bisa dinonaktifkan'],
                ]);
            }

            if (!$user->member) {
                throw ValidationException::withMessages([
                    'user_id' => ['Member record tidak ditemukan'],
                ]);
            }

            $memberIdBackup = $user->member->member_id;

            // Delete member record (hard delete)
            $user->member->delete();

            // Update user to rejected
            $user->update([
                'status' => 'rejected',
                'rejection_reason' => $request->rejection_reason,
                'rejected_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Member berhasil dinonaktifkan',
                'data' => [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'member_id' => $memberIdBackup,
                    'reason' => $user->rejection_reason,
                ],
            ]);

        } catch (ValidationException $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deactivating member: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal deactivate member',
            ], 500);
        }
    }
    /**
     * GET /owner/validation-history
     */
    public function getValidationHistory()
    {
        try {
            // Approved members dengan eager loading
            $approved = Member::with(['user:id,name,phone', 'tier'])
                ->orderBy('approved_at', 'desc')
                ->get()
                ->map(function ($member) {
                    return [
                        'user_id' => $member->user_id,
                        'member_id' => $member->member_id,
                        'name' => $member->user->name,
                        'phone' => $member->user->phone,
                        'tier' => $member->tier->name,  // ✅ FIXED - via relasi
                        'approved_at' => $member->approved_at->format('Y-m-d H:i:s'),
                    ];
                });

            // Rejected members
            $rejected = User::where('status', 'rejected')
                ->where('role', 'member')
                ->orderBy('rejected_at', 'desc')
                ->get(['id', 'name', 'phone', 'rejected_at', 'rejection_reason'])
                ->map(function ($user) {
                    return [
                        'user_id' => $user->id,
                        'name' => $user->name,
                        'phone' => $user->phone,
                        'rejected_at' => $user->rejected_at ? $user->rejected_at->format('Y-m-d H:i:s') : null,
                        'rejection_reason' => $user->rejection_reason,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'approved' => $approved,
                    'rejected' => $rejected,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting validation history: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil riwayat validasi',
            ], 500);
        }
    }
}