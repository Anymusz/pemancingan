<?php
// File: app/Http/Controllers/Api/Employee/QrisConfigController.php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\QrisConfig;
use Illuminate\Http\JsonResponse;

class QrisConfigController extends Controller
{
    /**
     * GET /api/employee/qris-config
     */
    public function show(): JsonResponse
    {
        $config = QrisConfig::current();

        return response()->json([
            'success' => true,
            'data'    => [
                'image_url' => $config->image_url,
            ],
        ]);
    }
}
