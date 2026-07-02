<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EmployeeAccountManagementTest extends TestCase
{
    use RefreshDatabase;

    private int $phoneCounter = 0;

    public function test_owner_can_create_employee_account(): void
    {
        $owner = $this->createUser('owner');

        Sanctum::actingAs($owner);

        $response = $this->postJson('/api/owner/employees', [
            'name' => 'Pegawai Kolam',
            'phone' => '089911122233',
            'email' => 'pegawai.kolam@example.com',
            'password' => 'Password123',
            'address' => 'Jl. Kolam No. 1',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Akun pegawai berhasil dibuat')
            ->assertJsonPath('data.employee.name', 'Pegawai Kolam')
            ->assertJsonPath('data.employee.phone', '089911122233')
            ->assertJsonPath('data.employee.email', 'pegawai.kolam@example.com')
            ->assertJsonPath('data.employee.address', 'Jl. Kolam No. 1')
            ->assertJsonPath('data.employee.role', 'employee')
            ->assertJsonPath('data.employee.status', 'active');

        $employeeId = $response->json('data.employee.id');
        $createdEmployee = User::find($employeeId);

        $this->assertNotNull($createdEmployee);
        $this->assertTrue(Hash::check('Password123', $createdEmployee->password));
        $this->assertArrayNotHasKey('password', $response->json('data.employee'));
    }

    public function test_owner_can_list_owner_and_employee_accounts(): void
    {
        $owner = $this->createUser('owner');
        $employee = $this->createUser('employee');
        $this->createUser('member');

        Sanctum::actingAs($owner);

        $response = $this->getJson('/api/owner/employees')
            ->assertOk()
            ->assertJsonPath('success', true);

        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertContains($owner->id, $ids);
        $this->assertContains($employee->id, $ids);
        $this->assertCount(2, $ids);
        $this->assertArrayNotHasKey('access_count', $response->json('data.0'));
    }

    public function test_owner_can_update_employee_account_name_and_password(): void
    {
        $owner = $this->createUser('owner');
        $employee = $this->createUser('employee');

        Sanctum::actingAs($owner);

        $this->putJson("/api/owner/employees/{$employee->id}", [
            'name' => 'Pegawai Baru',
            'phone' => '089944455566',
            'email' => 'pegawai.baru@example.com',
            'password' => 'Password456',
            'address' => 'Jl. Pegawai Baru',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Akun pegawai berhasil diperbarui')
            ->assertJsonPath('data.employee.name', 'Pegawai Baru')
            ->assertJsonPath('data.employee.phone', '089944455566')
            ->assertJsonPath('data.employee.email', 'pegawai.baru@example.com')
            ->assertJsonPath('data.employee.role', 'employee');

        $updatedEmployee = $employee->fresh();

        $this->assertSame('Pegawai Baru', $updatedEmployee->name);
        $this->assertSame('Jl. Pegawai Baru', $updatedEmployee->address);
        $this->assertTrue(Hash::check('Password456', $updatedEmployee->password));
    }

    public function test_owner_can_delete_employee_account(): void
    {
        $owner = $this->createUser('owner');
        $employee = $this->createUser('employee');

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/owner/employees/{$employee->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Akun pegawai berhasil dihapus');

        $this->assertDatabaseMissing('users', [
            'id' => $employee->id,
        ]);
    }

    public function test_employee_routes_only_require_employee_role(): void
    {
        $employee = $this->createUser('employee');

        Sanctum::actingAs($employee);

        $this->getJson('/api/employee/menus')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data', []);
    }

    private function createUser(string $role): User
    {
        $this->phoneCounter++;

        return User::factory()->create([
            'phone' => '089900000' . str_pad((string) $this->phoneCounter, 3, '0', STR_PAD_LEFT),
            'email' => "{$role}{$this->phoneCounter}@example.com",
            'address' => 'Jl. Test No. ' . $this->phoneCounter,
            'role' => $role,
            'status' => 'active',
        ]);
    }
}
