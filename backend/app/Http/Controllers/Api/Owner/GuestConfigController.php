<?php
// File: app/Http/Controllers/Api/Owner/GuestConfigController.php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\GuestConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuestConfigController extends Controller
{
    /**
     * GET /api/owner/guest-config
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

    /**
     * PUT /api/owner/guest-config
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'deposit_amount' => 'required|numeric|min:0',
        ]);

        $config = GuestConfig::current();
        $config->update(['deposit_amount' => $request->deposit_amount]);

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi deposit tamu berhasil diperbarui',
            'data'    => [
                'deposit_amount' => (float) $config->deposit_amount,
            ],
        ]);
    }
}
