<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\FishTypeController;
use App\Http\Controllers\Api\MemberTierController;
use App\Http\Controllers\Api\Owner\MemberValidationController;

// ========================================
// PUBLIC ROUTES (No Authentication)
// ========================================

// Auth Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Landing Page Public Data
Route::get('/events', [EventController::class, 'index']);
Route::get('/fish-types', [FishTypeController::class, 'index']);
Route::get('/member-tiers', [MemberTierController::class, 'index']);

// ========================================
// PROTECTED ROUTES (Require Authentication)
// ========================================

Route::middleware('auth:sanctum')->group(function () {
    
    // Auth Routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
});

// ========================================
// OWNER ROUTES (Require Authentication + Owner Role)
// ========================================

Route::prefix('owner')
    ->middleware(['auth:sanctum', 'role:owner'])
    ->group(function () {
        // Member validation endpoints
        Route::get('/pending-members', [MemberValidationController::class, 'getPendingMembers']);
        Route::post('/approve-member', [MemberValidationController::class, 'approveMember']);
        Route::post('/reject-member', [MemberValidationController::class, 'rejectMember']);
        Route::post('/reactivate-rejected', [MemberValidationController::class, 'reactivateRejectedMember']);
        Route::delete('/deactivate-member', [MemberValidationController::class, 'deactivateMember']);
        Route::get('/validation-history', [MemberValidationController::class, 'getValidationHistory']);
    });