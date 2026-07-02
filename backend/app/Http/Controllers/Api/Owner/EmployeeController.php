<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    /**
     * GET /api/owner/employees
     */
    public function index(): JsonResponse
    {
        $employees = User::whereIn('role', ['owner', 'employee'])
            ->orderBy('role')
            ->orderBy('name')
            ->get()
            ->map(fn (User $employee) => $this->formatEmployee($employee));

        return response()->json([
            'success' => true,
            'data' => $employees,
        ]);
    }

    /**
     * POST /api/owner/employees
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30', 'unique:users,phone'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'address' => ['sometimes', 'nullable', 'string'],
        ]);

        $employee = User::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'address' => ($validated['address'] ?? null) ?: '-',
            'role' => 'employee',
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Akun pegawai berhasil dibuat',
            'data' => [
                'employee' => $this->formatEmployee($employee),
            ],
        ], 201);
    }

    /**
     * PUT /api/owner/employees/{employee}
     */
    public function update(Request $request, int $employee): JsonResponse
    {
        $employeeUser = $this->findEmployee($employee);

        if (!$employeeUser) {
            return $this->employeeNotFoundResponse();
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:30', Rule::unique('users', 'phone')->ignore($employeeUser->id)],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($employeeUser->id)],
            'password' => ['sometimes', 'string', 'min:8'],
            'address' => ['sometimes', 'nullable', 'string'],
        ]);

        if ($validated === []) {
            return response()->json([
                'success' => false,
                'message' => 'Minimal satu field harus diisi untuk mengubah akun pegawai.',
            ], 422);
        }

        if (array_key_exists('address', $validated)) {
            $validated['address'] = $validated['address'] ?: '-';
        }

        $employeeUser->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Akun pegawai berhasil diperbarui',
            'data' => [
                'employee' => $this->formatEmployee($employeeUser->fresh()),
            ],
        ]);
    }

    /**
     * DELETE /api/owner/employees/{employee}
     */
    public function destroy(int $employee): JsonResponse
    {
        $employeeUser = $this->findEmployee($employee);

        if (!$employeeUser) {
            return $this->employeeNotFoundResponse();
        }

        try {
            DB::transaction(function () use ($employeeUser) {
                $employeeUser->tokens()->delete();
                $employeeUser->delete();
            });
        } catch (QueryException) {
            return response()->json([
                'success' => false,
                'message' => 'Akun pegawai tidak bisa dihapus karena sudah memiliki riwayat operasional.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Akun pegawai berhasil dihapus',
        ]);
    }

    private function findEmployee(int $employeeId): ?User
    {
        return User::where('id', $employeeId)
            ->where('role', 'employee')
            ->first();
    }

    private function formatEmployee(User $employee): array
    {
        return [
            'id' => $employee->id,
            'name' => $employee->name,
            'phone' => $employee->phone,
            'email' => $employee->email,
            'address' => $employee->address,
            'role' => $employee->role,
            'status' => $employee->status,
            'created_at' => $employee->created_at,
            'updated_at' => $employee->updated_at,
        ];
    }

    private function employeeNotFoundResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Pegawai tidak ditemukan',
        ], 404);
    }
}
