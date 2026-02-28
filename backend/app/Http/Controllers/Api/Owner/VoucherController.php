<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VoucherController extends Controller
{
    /**
     * GET /api/owner/vouchers
     */
    public function index(Request $request)
    {
        try {
            $query = Voucher::with('member.user');

            if ($request->has('status')) {
                $query->where('status', $request->query('status'));
            }

            if ($request->has('period_year')) {
                $query->where('period_year', $request->query('period_year'));
            }

            if ($request->has('period_month')) {
                $query->where('period_month', $request->query('period_month'));
            }

            $vouchers = $query->orderBy('issued_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data'    => $vouchers,
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching vouchers: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data voucher',
            ], 500);
        }
    }
}
