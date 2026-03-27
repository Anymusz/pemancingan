<?php
// File: app/Http/Controllers/Api/Owner/RentalItemController.php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\RentalItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RentalItemController extends Controller
{
    /**
     * GET /api/owner/rental-items
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->boolean('include_deleted')
            ? RentalItem::withTrashed()
            : RentalItem::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $items = $query->orderBy('name')->get();

        $activeCount   = $items->where('is_active', true)->count();
        $inactiveCount = $items->where('is_active', false)->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'rental_items'  => $items,
                'total'         => $items->count(),
                'active_count'  => $activeCount,
                'inactive_count'=> $inactiveCount,
            ],
        ]);
    }

    /**
     * POST /api/owner/rental-items
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:100|unique:rental_items,name',
            'price_per_unit' => 'required|numeric|min:1000',
            'unit_label'     => 'required|string|max:50',
            'description'    => 'nullable|string|max:1000',
            'image'          => 'nullable|file|image|max:5120',
            'is_active'      => 'sometimes|boolean',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $ext       = $request->file('image')->getClientOriginalExtension();
            $filename  = Str::uuid() . '.' . $ext;
            $request->file('image')->storeAs('rentals', $filename, 'public');
            $imagePath = $filename;
        }

        $item = RentalItem::create([
            'name'           => $validated['name'],
            'price_per_unit' => $validated['price_per_unit'],
            'unit_label'     => $validated['unit_label'],
            'description'    => $validated['description'] ?? null,
            'image'          => $imagePath,
            'is_active'      => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rental item berhasil ditambahkan',
            'data'    => ['rental_item' => $item],
        ], 201);
    }

    /**
     * PUT /api/owner/rental-items/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $item = RentalItem::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Rental item tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:100', Rule::unique('rental_items', 'name')->ignore($id)],
            'price_per_unit' => 'required|numeric|min:1000',
            'unit_label'     => 'required|string|max:50',
            'description'    => 'nullable|string|max:1000',
            'image'          => 'nullable|file|image|max:5120',
            'remove_image'   => 'sometimes|boolean',
            'is_active'      => 'sometimes|boolean',
        ]);

        // Handle image removal
        if ($request->boolean('remove_image') && $item->image) {
            Storage::disk('public')->delete('rentals/' . $item->image);
            $item->image = null;
        }

        // Handle new image upload
        if ($request->hasFile('image')) {
            // Delete old image first
            if ($item->image) {
                Storage::disk('public')->delete('rentals/' . $item->image);
            }
            $ext      = $request->file('image')->getClientOriginalExtension();
            $filename = Str::uuid() . '.' . $ext;
            $request->file('image')->storeAs('rentals', $filename, 'public');
            $item->image = $filename;
        }

        $item->name           = $validated['name'];
        $item->price_per_unit = $validated['price_per_unit'];
        $item->unit_label     = $validated['unit_label'];
        $item->description    = $validated['description'] ?? null;
        if (isset($validated['is_active'])) {
            $item->is_active = $validated['is_active'];
        }
        $item->save();

        return response()->json([
            'success' => true,
            'message' => 'Rental item berhasil diperbarui',
            'data'    => ['rental_item' => $item->fresh()],
        ]);
    }

    /**
     * DELETE /api/owner/rental-items/{id}
     * Soft delete — tidak hapus gambar (konsisten dengan pola events).
     */
    public function destroy(int $id): JsonResponse
    {
        $item = RentalItem::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Rental item tidak ditemukan',
            ], 404);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rental item berhasil dihapus',
        ]);
    }

    /**
     * PATCH /api/owner/rental-items/{id}/toggle-active
     */
    public function toggleActive(int $id): JsonResponse
    {
        $item = RentalItem::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Rental item tidak ditemukan',
            ], 404);
        }

        $item->update(['is_active' => !$item->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Status rental item berhasil diubah',
            'data'    => ['rental_item' => $item->fresh()],
        ]);
    }
}