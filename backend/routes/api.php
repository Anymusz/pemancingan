<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\FishTypeController;
use App\Http\Controllers\Api\MemberTierController;
use App\Http\Controllers\Api\Member\MemberController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\Owner\MemberValidationController;
use App\Http\Controllers\Api\Owner\LeaderboardController;
use App\Http\Controllers\Api\Owner\MenuController as OwnerMenuController;
use App\Http\Controllers\Api\Owner\FishTypeController as OwnerFishTypeController;
use App\Http\Controllers\Api\Owner\EventController as OwnerEventController;
use App\Http\Controllers\Api\Employee\ArrivalController;
use App\Http\Controllers\Api\Employee\TransactionController;
use App\Http\Controllers\Api\Employee\PendingOrderController;
use App\Http\Controllers\Api\Employee\MenuController as EmployeeMenuController;
use App\Http\Controllers\Api\Employee\FishStockController as EmployeeFishStockController;
use App\Http\Controllers\Api\Member\OrderController;
use App\Http\Controllers\Api\Owner\FishStockController as OwnerFishStockController;
use App\Http\Controllers\Api\Owner\VoucherController as OwnerVoucherController;
use App\Http\Controllers\Api\Owner\VoucherConfigController as OwnerVoucherConfigController;
use App\Http\Controllers\Api\Owner\ReportController as OwnerReportController;
use App\Http\Controllers\Api\Owner\RentalItemController as OwnerRentalItemController;
use App\Http\Controllers\Api\Owner\GuestConfigController as OwnerGuestConfigController;
use App\Http\Controllers\Api\Owner\QrisConfigController as OwnerQrisConfigController;
use App\Http\Controllers\Api\Owner\EmployeeController as OwnerEmployeeController;
use App\Http\Controllers\Api\Owner\ActivityController as OwnerActivityController;
use App\Http\Controllers\Api\Employee\RentalItemController as EmployeeRentalItemController;
use App\Http\Controllers\Api\Employee\GuestConfigController as EmployeeGuestConfigController;
use App\Http\Controllers\Api\Employee\QrisConfigController as EmployeeQrisConfigController;

// ========================================
// PUBLIC ROUTES
// ========================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
    ->middleware('throttle:1,1')
    ->name('password.email');

Route::post('/reset-password', [AuthController::class, 'resetPassword'])
    ->name('password.update');

Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{id}', [EventController::class, 'show']);
Route::get('/fish-types', [FishTypeController::class, 'index']);
Route::get('/member-tiers', [MemberTierController::class, 'index']);
Route::get('/leaderboard', [MemberController::class, 'getLeaderboard']);
Route::get('/special-menus', [MenuController::class, 'specialMenus']);

// ========================================
// PROTECTED ROUTES
// ========================================
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/menus', [MenuController::class, 'index']); // member & employee: hanya menu available
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::put('/user/password', [UserController::class, 'updatePassword']);

    // Notifications (semua role)
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
    });

    Route::prefix('member')->middleware('role:member')->group(function () {
        Route::get('/profile', [MemberController::class, 'getProfile']);
        Route::get('/transactions', [MemberController::class, 'getTransactionsHistory']);
        Route::get('/vouchers', [MemberController::class, 'getVouchers']);
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
    Route::get('/members/active', [MemberValidationController::class, 'getActiveMembers']);
    Route::get('/members/deactivated', [MemberValidationController::class, 'getDeactivatedMembers']);
    Route::get('/members/counts', [MemberValidationController::class, 'getMemberCounts']);

    // Leaderboard
    Route::get('/leaderboard', [LeaderboardController::class, 'getOwnerLeaderboard']);

    // Menu Management
    Route::get('/menus', [OwnerMenuController::class, 'index']);
    Route::post('/menus', [OwnerMenuController::class, 'store']);
    Route::put('/menus/{id}', [OwnerMenuController::class, 'update']);
    Route::delete('/menus/{id}', [OwnerMenuController::class, 'destroy']);
    Route::patch('/menus/{id}/availability', [OwnerMenuController::class, 'updateAvailability']);
    Route::patch('/menus/{id}/toggle-special', [OwnerMenuController::class, 'toggleSpecial']);

    // Fish Type Management
    Route::get('/fish-types', [OwnerFishTypeController::class, 'index']);
    Route::post('/fish-types', [OwnerFishTypeController::class, 'store']);
    Route::put('/fish-types/{id}', [OwnerFishTypeController::class, 'update']);
    Route::delete('/fish-types/{id}', [OwnerFishTypeController::class, 'destroy']);
    Route::patch('/fish-types/{id}/toggle-active', [OwnerFishTypeController::class, 'toggleActive']);

    // Fish Stock Management
    Route::get('/fish-stocks', [OwnerFishStockController::class, 'index']);
    Route::get('/fish-stocks/history', [OwnerFishStockController::class, 'allHistory']);
    Route::post('/fish-stocks/{fishTypeId}/restock', [OwnerFishStockController::class, 'restock']);
    Route::patch('/fish-stocks/{fishTypeId}/threshold', [OwnerFishStockController::class, 'updateThreshold']);
    Route::get('/fish-stocks/{fishTypeId}/history', [OwnerFishStockController::class, 'history']);

    // Event Management
    Route::get('/events', [OwnerEventController::class, 'index']);
    Route::post('/events', [OwnerEventController::class, 'store']);
    Route::post('/events/{id}', [OwnerEventController::class, 'update']);
    Route::patch('/events/{id}/publish', [OwnerEventController::class, 'publish']);
    Route::delete('/events/{id}', [OwnerEventController::class, 'destroy']);

    // Voucher Management
    Route::get('/vouchers', [OwnerVoucherController::class, 'index']);

    // Voucher Config
    Route::get('/voucher-configs', [OwnerVoucherConfigController::class, 'index']);
    Route::put('/voucher-configs', [OwnerVoucherConfigController::class, 'update']);

    // Reports
    Route::get('/reports/summary', [OwnerReportController::class, 'summary']);
    Route::get('/reports/breakdown', [OwnerReportController::class, 'breakdown']);
    Route::get('/reports/transactions', [OwnerReportController::class, 'transactions']);
    Route::get('/reports/export', [OwnerReportController::class, 'export']);
    Route::get('/reports/stock-summary', [OwnerReportController::class, 'stockSummary']);
    Route::get('/reports/daily-trend', [OwnerReportController::class, 'dailyTrend']);

    // Rental Item Management
    Route::get('/rental-items', [OwnerRentalItemController::class, 'index']);
    Route::post('/rental-items', [OwnerRentalItemController::class, 'store']);
    Route::put('/rental-items/{id}', [OwnerRentalItemController::class, 'update']);
    Route::delete('/rental-items/{id}', [OwnerRentalItemController::class, 'destroy']);
    Route::patch('/rental-items/{id}/toggle-active', [OwnerRentalItemController::class, 'toggleActive']);

    // Guest Config
    Route::get('/guest-config', [OwnerGuestConfigController::class, 'show']);
    Route::put('/guest-config', [OwnerGuestConfigController::class, 'update']);

    // QRIS Config
    Route::get('/qris-config', [OwnerQrisConfigController::class, 'show']);
    Route::put('/qris-config', [OwnerQrisConfigController::class, 'update']);

    // Employee Management
    Route::get('/employees', [OwnerEmployeeController::class, 'index']);
    Route::post('/employees', [OwnerEmployeeController::class, 'store']);
    Route::put('/employees/{id}', [OwnerEmployeeController::class, 'update']);
    Route::put('/employees/{id}/password', [OwnerEmployeeController::class, 'updatePassword']);
    Route::patch('/employees/{id}/deactivate', [OwnerEmployeeController::class, 'deactivate']);
    Route::patch('/employees/{id}/reactivate', [OwnerEmployeeController::class, 'reactivate']);

    // Activity Log
    Route::get('/activity/transactions', [OwnerActivityController::class, 'transactions']);
    Route::get('/activity/orders', [OwnerActivityController::class, 'orders']);
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
    Route::post('/resolve-qr', [ArrivalController::class, 'resolveQR']);

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

    // Fish Stocks
    Route::get('/fish-stocks', [EmployeeFishStockController::class, 'index']);

    // Rental Items
    Route::get('/rental-items', [EmployeeRentalItemController::class, 'index']);
    Route::patch('/rental-items/{id}/toggle-active', [EmployeeRentalItemController::class, 'toggleActive']);

    // Guest Config
    Route::get('/guest-config', [EmployeeGuestConfigController::class, 'show']);

    // QRIS Config
    Route::get('/qris-config', [EmployeeQrisConfigController::class, 'show']);
});
