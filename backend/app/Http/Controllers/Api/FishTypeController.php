<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FishTypeController extends Controller
{
    /**
     * Display a listing of active fish types.
     * 
     * Return semua jenis ikan yang is_active = true untuk landing page
     */
    public function index()
    {
        $fishTypes = DB::table('fish_types')
            ->where('is_active', true)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $fishTypes
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // TODO: Implementasi saat fase CRUD owner (butuh auth, validation, role)
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
        // TODO: Implementasi saat fase CRUD owner (butuh auth, validation, role)
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // TODO: Implementasi saat fase CRUD owner (butuh auth, validation, role)
    }
}