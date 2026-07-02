<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    /**
     * GET /api/owner/employees
     */
    public function index(): JsonResponse
    {
        $employees = User::where('role', 'employee')
            ->orderBy('name')
            ->get()
            ->map(fn (User $employee) => $this->formatEmployee($employee));

        return response()->json([
            'success' => true,
            'message' => 'Data pegawai berhasil diambil',
            'data' => [
                'employees' => $employees,
            ],
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
            'address' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8'],
            'password_confirmation' => ['sometimes', 'same:password'],
        ]);

        unset($validated['password_confirmation']);

        $employee = User::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'address' => $validated['address'],
            'password' => Hash::make($validated['password']),
            'role' => 'employee',
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pegawai berhasil ditambahkan',
            'data' => [
                'employee' => $this->formatEmployee($employee),
            ],
        ], 201);
    }

    /**
     * PUT /api/owner/employees/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $employee = $this->findEmployee($id);

        if (!$employee) {
            return $this->employeeNotFoundResponse();
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'required', 'string', 'max:30', Rule::unique('users', 'phone')->ignore($employee->id)],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($employee->id)],
            'address' => ['sometimes', 'required', 'string'],
            'password' => ['sometimes', 'string', 'min:8'],
            'password_confirmation' => ['sometimes', 'same:password'],
        ]);

        unset($validated['password_confirmation']);

        if ($validated === []) {
            return response()->json([
                'success' => false,
                'message' => 'Minimal satu field harus diisi untuk mengubah akun pegawai.',
            ], 422);
        }

        if (array_key_exists('password', $validated)) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $employee->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data pegawai berhasil diperbarui',
            'data' => [
                'employee' => $this->formatEmployee($employee->fresh()),
            ],
        ]);
    }

    /**
     * PUT /api/owner/employees/{id}/password
     */
    public function updatePassword(Request $request, int $id): JsonResponse
    {
        $employee = $this->findEmployee($id);

        if (!$employee) {
            return $this->employeeNotFoundResponse();
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8'],
            'password_confirmation' => ['sometimes', 'same:password'],
        ]);

        $employee->update([
            'password' => Hash::make($validated['password']),
        ]);
        $employee->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password pegawai berhasil direset',
        ]);
    }

    /**
     * PATCH /api/owner/employees/{id}/deactivate
     */
    public function deactivate(Request $request, int $id): JsonResponse
    {
        $employee = $this->findEmployee($id);

        if (!$employee) {
            return $this->employeeNotFoundResponse();
        }

        if ($employee->status === 'deactivated') {
            return response()->json([
                'success' => false,
                'message' => 'Pegawai sudah nonaktif',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $employee->update([
            'status' => 'deactivated',
            'deactivated_reason' => $validated['reason'],
            'deactivated_at' => now(),
        ]);
        $employee->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pegawai berhasil dinonaktifkan',
        ]);
    }

    /**
     * PATCH /api/owner/employees/{id}/reactivate
     */
    public function reactivate(int $id): JsonResponse
    {
        $employee = $this->findEmployee($id);

        if (!$employee) {
            return $this->employeeNotFoundResponse();
        }

        if ($employee->status !== 'deactivated') {
            return response()->json([
                'success' => false,
                'message' => 'Pegawai sudah aktif',
            ], 422);
        }

        $employee->update([
            'status' => 'active',
            'deactivated_reason' => null,
            'deactivated_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pegawai berhasil diaktifkan kembali',
        ]);
    }

    /**
     * DELETE /api/owner/employees/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $employee = $this->findEmployee($id);

        if (!$employee) {
            return $this->employeeNotFoundResponse();
        }

        try {
            DB::transaction(function () use ($employee) {
                $employee->tokens()->delete();
                $employee->delete();
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
            'deactivated_reason' => $employee->deactivated_reason,
            'deactivated_at' => $employee->deactivated_at,
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
