<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemberTierController extends Controller
{
    /**
     * Display a listing of member tiers.
     * 
     * Return semua tier untuk landing page (benefit section)
     */
    public function index()
    {
        $tiers = DB::table('member_tiers')
            ->orderBy('min_points', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tiers
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // TODO: Tier adalah master data, tidak perlu CRUD kecuali edit benefit
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        // TODO: Implementasi jika dibutuhkan
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // TODO: Implementasi saat fase update benefit tier (butuh auth owner)
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // TODO: Tier tidak bisa dihapus (master data fixed)
    }
}