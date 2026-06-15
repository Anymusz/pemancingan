<?php
// File: app/Http/Controllers/Api/Owner/QrisConfigController.php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\QrisConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class QrisConfigController extends Controller
{
    /**
     * GET /api/owner/qris-config
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

    /**
     * PUT /api/owner/qris-config
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
        ]);

        $config = QrisConfig::current();

        if (!$request->hasFile('image')) {
            return response()->json([
                'success' => true,
                'message' => 'Tidak ada perubahan gambar',
                'data'    => ['image_url' => $config->image_url],
            ]);
        }

        if ($config->image) {
            Storage::disk('public')->delete($config->image);
        }

        $ext      = $request->file('image')->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $ext;
        $path     = $request->file('image')->storeAs('qris', $filename, 'public');

        $config->update(['image' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'QRIS berhasil diperbarui',
            'data'    => [
                'image_url' => $config->image_url,
            ],
        ]);
    }
}