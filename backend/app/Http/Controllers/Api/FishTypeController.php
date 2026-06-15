<?php
// File: app/Http/Controllers/Api/FishTypeController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FishType;

class FishTypeController extends Controller
{
    public function index()
    {
        $fishTypes = FishType::where('is_active', true)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $fishTypes,
        ]);
    }
}