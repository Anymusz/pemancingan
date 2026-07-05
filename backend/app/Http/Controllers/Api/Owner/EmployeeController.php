<?php
namespace App\Http\Controllers\Api\Owner;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
class EmployeeController extends Controller
{
    /**
     * Return all employees ordered by name.
     * GET /owner/employees
     */
    public function index()
    {
        $employees = User::where('role', 'employee')
            ->orderBy('name')
            ->get([
                'id', 'name', 'email', 'phone', 'address',
                'status', 'created_at', 'deactivated_reason', 'deactivated_at',
            ]);
        return response()->json([
            'success' => true,
            'message' => 'Data pegawai berhasil diambil',
            'data'    => ['employees' => $employees],
        ]);
    }
    /**
     * Create a new employee account.
     * POST /owner/employees
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email|unique:users,email',
            'phone'                 => 'required|string|unique:users,phone',
            'address'               => 'required|string',
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        $employee = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'phone'    => $validated['phone'],
            'address'  => $validated['address'],
            'password' => Hash::make($validated['password']),
            'role'     => 'employee',
            'status'   => 'active',
        ]);
        return response()->json([
            'success' => true,
            'message' => 'Pegawai berhasil ditambahkan',
            'data'    => [
                'employee' => $employee->only([
                    'id', 'name', 'email', 'phone', 'address',
                    'status', 'created_at',
                ]),
            ],
        ], 201);
    }
    /**
     * Update employee profile (name, email, phone, address).
     * PUT /owner/employees/{id}
     */
    public function update(Request $request, int $id)
    {
        $employee = User::where('id', $id)->where('role', 'employee')->first();
        if (! $employee) {
            return response()->json([
                'success' => false,
                'message' => 'Pegawai tidak ditemukan',
            ], 404);
        }
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => "required|email|unique:users,email,{$id}",
            'phone'   => "required|string|unique:users,phone,{$id}",
            'address' => 'required|string',
        ]);
        $employee->update($validated);
        return response()->json([
            'success' => true,
            'message' => 'Data pegawai berhasil diperbarui',
            'data'    => [
                'employee' => $employee->fresh()->only([
                    'id', 'name', 'email', 'phone', 'address',
                    'status', 'created_at', 'deactivated_reason', 'deactivated_at',
                ]),
            ],
        ]);
    }
    /**
     * Reset employee password (revokes all active tokens).
     * PUT /owner/employees/{id}/password
     */
    public function updatePassword(Request $request, int $id)
    {
        $employee = User::where('id', $id)->where('role', 'employee')->first();
        if (! $employee) {
            return response()->json([
                'success' => false,
                'message' => 'Pegawai tidak ditemukan',
            ], 404);
        }
        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        $employee->update([
            'password' => Hash::make($request->password),
        ]);
        // Force logout from all devices
        $employee->tokens()->delete();
        return response()->json([
            'success' => true,
            'message' => 'Password pegawai berhasil direset',
        ]);
    }
    /**
     * Deactivate an employee (revokes all active tokens).
     * PATCH /owner/employees/{id}/deactivate
     */
    public function deactivate(Request $request, int $id)
    {
        $employee = User::where('id', $id)->where('role', 'employee')->first();
        if (! $employee) {
            return response()->json([
                'success' => false,
                'message' => 'Pegawai tidak ditemukan',
            ], 404);
        }
        if ($employee->status === 'deactivated') {
            return response()->json([
                'success' => false,
                'message' => 'Employee sudah nonaktif',
            ], 422);
        }
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);
        $employee->update([
            'status'             => 'deactivated',
            'deactivated_reason' => $request->reason,
            'deactivated_at'     => now(),
        ]);
        // Force logout
        $employee->tokens()->delete();
        return response()->json([
            'success' => true,
            'message' => 'Pegawai berhasil dinonaktifkan',
        ]);
    }
    /**
     * Reactivate a deactivated employee.
     * PATCH /owner/employees/{id}/reactivate
     */
    public function reactivate(int $id)
    {
        $employee = User::where('id', $id)->where('role', 'employee')->first();
        if (! $employee) {
            return response()->json([
                'success' => false,
                'message' => 'Pegawai tidak ditemukan',
            ], 404);
        }
        if ($employee->status !== 'deactivated') {
            return response()->json([
                'success' => false,
                'message' => 'Employee sudah aktif',
            ], 422);
        }
        $employee->update([
            'status'             => 'active',
            'deactivated_reason' => null,
            'deactivated_at'     => null,
        ]);
        return response()->json([
            'success' => true,
            'message' => 'Pegawai berhasil diaktifkan kembali',
        ]);
    }
}
