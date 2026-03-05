<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Register new user account
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        // Validation
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:users,phone',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'address' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Create user with pending status
        $user = User::create([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'password' => $request->password, // Auto-hashed by cast
            'address' => $request->address,
            'role' => 'member',
            'status' => 'pending',
        ]);

        // Notifikasi: Member baru mendaftar → kirim ke semua owner
        NotificationService::sendToRole(
            'owner',
            'member_pending',
            'Member Baru Mendaftar',
            "Member baru '{$user->name}' menunggu validasi."
        );

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil. Akun menunggu validasi owner.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
                'address' => $user->address,
                'role' => $user->role,
                'status' => $user->status,
            ]
        ], 201);
    }

    /**
     * Login user with phone or email
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
{
    // Validation
    $validator = Validator::make($request->all(), [
        'login' => 'required|string',
        'password' => 'required|string',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation error',
            'errors' => $validator->errors()
        ], 422);
    }

    // Detect login field (email or phone)
    $loginField = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'phone';

    // Attempt login
    if (!Auth::attempt([$loginField => $request->login, 'password' => $request->password])) {
        return response()->json([
            'success' => false,
            'message' => 'Email/Phone atau password salah'
        ], 401);
    }

    // Get authenticated user
    $user = Auth::user();

    // Check user status - PENDING
    if ($user->status === 'pending') {
        Auth::logout();
        return response()->json([
            'success' => false,
            'message' => 'Akun masih menunggu validasi owner'
        ], 403);
    }

    // Check user status - REJECTED
    if ($user->status === 'rejected') {
        Auth::logout();

        $message = 'Akun ditolak oleh owner';

        if ($user->rejection_reason) {
            $message .= '. Alasan: ' . $user->rejection_reason;
        }

        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => [
                'rejection_reason' => $user->rejection_reason,
                'rejected_at' => $user->rejected_at ? $user->rejected_at->format('Y-m-d H:i:s') : null,
            ]
        ], 403);
    }

    // Generate token (only for active users)
    $token = $user->createToken('auth-token')->plainTextToken;

    return response()->json([
        'success' => true,
        'message' => 'Login berhasil',
        'data' => [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
                'address' => $user->address,
                'role' => $user->role,
                'status' => $user->status,
            ],
            'token' => $token
        ]
    ], 200);
}

    /**
 * Logout user (revoke current token)
 *
 * @param Request $request
 * @return \Illuminate\Http\JsonResponse
 */
public function logout(Request $request)
{
    // Revoke current access token
    /** @var \Laravel\Sanctum\PersonalAccessToken $token */
    $token = $request->user()->currentAccessToken();
    $token->delete();

    return response()->json([
        'success' => true,
        'message' => 'Logout berhasil'
    ], 200);
}

    /**
     * Get authenticated user data
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
                'address' => $user->address,
                'role' => $user->role,
                'status' => $user->status,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]
        ], 200);
    }
}
