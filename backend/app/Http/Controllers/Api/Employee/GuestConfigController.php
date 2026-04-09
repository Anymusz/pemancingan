<?php
// File: app/Http/Controllers/Api/Employee/GuestConfigController.php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\GuestConfig;
use Illuminate\Http\JsonResponse;

class GuestConfigController extends Controller
{
    /**
     * GET /api/employee/guest-config
     */
    public function show(): JsonResponse
    {
        $config = GuestConfig::current();

        return response()->json([
            'success' => true,
            'data'    => [
                'deposit_amount' => (float) $config->deposit_amount,
            ],
        ]);
    }
}
