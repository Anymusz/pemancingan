<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EventController extends Controller
{
    public function index(Request $request)
    {
        // Query published events, urutkan dari terbaru
        $events = DB::table('events')
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $events
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // TODO: Implementasi saat fase CRUD (butuh auth, validation, role)
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        // TODO: Implementasi saat fase detail event
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
    }

    public function destroy(string $id)
    {
        // TODO: Implementasi saat fase CRUD (butuh auth, validation, role)
    }
}