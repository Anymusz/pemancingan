<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\FishTypeController;
use App\Http\Controllers\Api\MemberTierController;

// Public endpoints untuk landing page (no auth)
Route::get('/events', [EventController::class, 'index']);
Route::get('/fish-types', [FishTypeController::class, 'index']);
Route::get('/member-tiers', [MemberTierController::class, 'index']);