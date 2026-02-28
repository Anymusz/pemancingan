<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\FishTypeController;
use App\Http\Controllers\Api\MemberTierController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\Owner\MemberValidationController;
use App\Http\Controllers\Api\Owner\LeaderboardController;
use App\Http\Controllers\Api\Owner\MenuController as OwnerMenuController;
use App\Http\Controllers\Api\Owner\FishTypeController as OwnerFishTypeController;
use App\Http\Controllers\Api\Owner\EventController as OwnerEventController;
use App\Http\Controllers\Api\Employee\ArrivalController;
use App\Http\Controllers\Api\Employee\TransactionController;
use App\Http\Controllers\Api\Employee\PendingOrderController;
use App\Http\Controllers\Api\Employee\MenuController as EmployeeMenuController;
use App\Http\Controllers\Api\Member\OrderController;
use App\Http\Controllers\Api\Owner\FishStockController as OwnerFishStockController;
use App\Http\Controllers\Api\Owner\VoucherController as OwnerVoucherController;
use App\Http\Controllers\Api\Owner\VoucherConfigController as OwnerVoucherConfigController;

// ========================================
// PUBLIC ROUTES
// ========================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/events', [EventController::class, 'index']);
Route::get('/fish-types', [FishTypeController::class, 'index']);
Route::get('/member-tiers', [MemberTierController::class, 'index']);
Route::get('/leaderboard', [MemberController::class, 'getLeaderboard']);

// ========================================
// PROTECTED ROUTES
// ========================================
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/menus', [MenuController::class, 'index']); // member & employee: hanya menu available
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::prefix('member')->middleware('role:member')->group(function () {
        Route::get('/profile', [MemberController::class, 'getProfile']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/orders', [OrderController::class, 'getMyOrders']);
    });
});

// ========================================
// OWNER ROUTES
// ========================================
Route::prefix('owner')->middleware(['auth:sanctum', 'role:owner'])->group(function () {
    // Member Validation
    Route::get('/pending-members', [MemberValidationController::class, 'getPendingMembers']);
    Route::post('/approve-member', [MemberValidationController::class, 'approveMember']);
    Route::post('/reject-member', [MemberValidationController::class, 'rejectMember']);
    Route::post('/reactivate-rejected', [MemberValidationController::class, 'reactivateRejectedMember']);
    Route::delete('/deactivate-member', [MemberValidationController::class, 'deactivateMember']);
    Route::get('/validation-history', [MemberValidationController::class, 'getValidationHistory']);

    // Leaderboard
    Route::get('/leaderboard', [LeaderboardController::class, 'getOwnerLeaderboard']);

    // Menu Management
    Route::get('/menus', [OwnerMenuController::class, 'index']);
    Route::post('/menus', [OwnerMenuController::class, 'store']);
    Route::put('/menus/{id}', [OwnerMenuController::class, 'update']);
    Route::delete('/menus/{id}', [OwnerMenuController::class, 'destroy']);
    Route::patch('/menus/{id}/availability', [OwnerMenuController::class, 'updateAvailability']);

    // Fish Type Management
    Route::get('/fish-types', [OwnerFishTypeController::class, 'index']);
    Route::post('/fish-types', [OwnerFishTypeController::class, 'store']);
    Route::put('/fish-types/{id}', [OwnerFishTypeController::class, 'update']);
    Route::delete('/fish-types/{id}', [OwnerFishTypeController::class, 'destroy']);
    Route::patch('/fish-types/{id}/toggle-active', [OwnerFishTypeController::class, 'toggleActive']);

    // Fish Stock Management
    Route::get('/fish-stocks', [OwnerFishStockController::class, 'index']);
    Route::post('/fish-stocks/{fishTypeId}/restock', [OwnerFishStockController::class, 'restock']);
    Route::patch('/fish-stocks/{fishTypeId}/threshold', [OwnerFishStockController::class, 'updateThreshold']);
    Route::get('/fish-stocks/{fishTypeId}/history', [OwnerFishStockController::class, 'history']);

    // Event Management
    Route::get('/events', [OwnerEventController::class, 'index']);
    Route::post('/events', [OwnerEventController::class, 'store']);
    Route::put('/events/{id}', [OwnerEventController::class, 'update']);
    Route::patch('/events/{id}/publish', [OwnerEventController::class, 'publish']);
    Route::delete('/events/{id}', [OwnerEventController::class, 'destroy']);

    // Voucher Management
    Route::get('/vouchers', [OwnerVoucherController::class, 'index']);

    // Voucher Config
    Route::get('/voucher-configs', [OwnerVoucherConfigController::class, 'index']);
    Route::put('/voucher-configs', [OwnerVoucherConfigController::class, 'update']);
});

// ========================================
// EMPLOYEE ROUTES
// ========================================
Route::prefix('employee')->middleware(['auth:sanctum', 'role:employee'])->group(function () {
    // Arrival
    Route::post('/check-in', [ArrivalController::class, 'checkIn']);
    Route::get('/today-arrivals', [ArrivalController::class, 'todayArrivals']);
    Route::post('/check-out/{arrival_id}', [ArrivalController::class, 'checkOut']);
    Route::get('/search-member', [ArrivalController::class, 'searchMember']);
    Route::get('/search-arrival', [ArrivalController::class, 'searchArrival']);

    // Pending Orders
    Route::post('/pending-orders', [PendingOrderController::class, 'store']);
    Route::get('/pending-orders', [PendingOrderController::class, 'all']);
    Route::get('/pending-orders/{arrival_id}', [PendingOrderController::class, 'index']);
    Route::patch('/pending-orders/{id}/status', [PendingOrderController::class, 'updateStatus']);

    // Transactions
    Route::post('/checkout', [TransactionController::class, 'checkout']);
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::get('/transactions/{id}', [TransactionController::class, 'show']);

    // Menu Availability
    Route::get('/menus', [EmployeeMenuController::class, 'index']);
    Route::patch('/menus/{id}/availability', [EmployeeMenuController::class, 'updateAvailability']);

    // Voucher
    Route::get('/member-voucher/{memberId}', [TransactionController::class, 'getMemberVoucher']);
});
