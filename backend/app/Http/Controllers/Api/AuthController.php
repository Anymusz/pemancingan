<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * POST /register
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:users,phone',
            'email' => 'required|email|unique:users,email',
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
     * POST /login
     * Login user with phone or email
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

    // Check user status - DEACTIVATED
    if ($user->status === 'deactivated') {
        Auth::logout();
        $message = 'Akun Anda telah dinonaktifkan';
        if ($user->deactivated_reason) {
            $message .= '. Alasan: ' . $user->deactivated_reason;
        }
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => [
                'deactivated_reason' => $user->deactivated_reason,
                'deactivated_at' => $user->deactivated_at?->format('Y-m-d H:i:s'),
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
                'created_at' => $user->created_at,
                'feature_accesses' => $user->featureAccessPayload(),
            ],
            'token' => $token
        ]
    ], 200);
}

/**
 * POST /logout
 * Logout user (revoke current token)
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
     * GET /me
     * Get authenticated user data
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
                'feature_accesses' => $user->featureAccessPayload(),
            ]
        ], 200);
    }

    /**
     * POST /api/forgot-password
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        \Illuminate\Auth\Notifications\ResetPassword::createUrlUsing(function ($notifiable, $token) {
            return config('app.frontend_url') . '/reset-password?token=' . $token . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
        });

        Password::sendResetLink(
            $request->only('email')
        );

        return response()->json([
            'success' => true,
            'message' => 'Jika email terdaftar, link reset password akan dikirim.'
        ], 200);
    }

    /**
     * POST /api/reset-password
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token'    => 'required|string',
            'email'    => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' => 'Password berhasil direset. Silakan login kembali.'
            ], 200);
        }

        return response()->json([
            'success' => false,
            'message' => 'Link reset password tidak valid atau sudah expired.'
        ], 422);
    }
}
