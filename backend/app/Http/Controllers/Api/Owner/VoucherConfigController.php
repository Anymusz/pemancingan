<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\VoucherConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VoucherConfigController extends Controller
{
    /**
     * GET /api/owner/voucher-configs
     */
    public function index()
    {
        try {
            $configs = VoucherConfig::orderBy('rank', 'asc')->get();

            return response()->json([
                'success' => true,
                'data'    => $configs,
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching voucher configs: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data konfigurasi voucher',
            ], 500);
        }
    }

    /**
     * PUT /api/owner/voucher-configs
     * Does not affect already-issued vouchers (amount is snapshotted).
     */
    public function update(Request $request)
    {
        try {
            $request->validate([
                'configs'          => 'required|array',
                'configs.*.rank'   => 'required|integer|in:1,2,3',
                'configs.*.amount' => 'required|numeric|min:1000',
            ]);

            $updatedConfigs = [];

            foreach ($request->input('configs') as $item) {
                $config = VoucherConfig::updateOrCreate(
                    ['rank'   => $item['rank']],
                    ['amount' => $item['amount']]
                );
                $updatedConfigs[] = $config;
            }

            return response()->json([
                'success' => true,
                'message' => 'Konfigurasi voucher berhasil diperbarui',
                'data'    => $updatedConfigs,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating voucher configs: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui konfigurasi voucher',
            ], 500);
        }
    }
}
