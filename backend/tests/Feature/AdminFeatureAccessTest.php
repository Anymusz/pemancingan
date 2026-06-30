<?php

namespace Tests\Feature;

use App\Models\AdminFeatureAccess;
use App\Models\Feature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminFeatureAccessTest extends TestCase
{
    use RefreshDatabase;

    private int $phoneCounter = 0;

    public function test_owner_can_grant_update_and_revoke_employee_feature_access(): void
    {
        $owner = $this->createUser('owner');
        $employee = $this->createUser('employee');
        $feature = $this->createFeature('employee.menu_availability');

        Sanctum::actingAs($owner);

        $this->postJson("/api/owner/admin-access/admins/{$employee->id}/accesses", [
            'feature_id' => $feature->id,
            'permissions' => ['view', 'update'],
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.feature.slug', 'employee.menu_availability')
            ->assertJsonPath('data.can_view', true)
            ->assertJsonPath('data.can_update', true);

        $this->assertDatabaseHas('admin_feature_accesses', [
            'user_id' => $employee->id,
            'feature_id' => $feature->id,
            'can_view' => 1,
            'can_create' => 0,
            'can_update' => 1,
            'can_delete' => 0,
            'granted_by' => $owner->id,
        ]);

        $this->putJson("/api/owner/admin-access/admins/{$employee->id}/accesses/{$feature->slug}", [
            'permissions' => ['create'],
        ])
            ->assertOk()
            ->assertJsonPath('data.can_view', true)
            ->assertJsonPath('data.can_create', true)
            ->assertJsonPath('data.can_update', false);

        $this->assertDatabaseHas('admin_feature_accesses', [
            'user_id' => $employee->id,
            'feature_id' => $feature->id,
            'can_view' => 1,
            'can_create' => 1,
            'can_update' => 0,
            'can_delete' => 0,
        ]);

        $this->deleteJson("/api/owner/admin-access/admins/{$employee->id}/accesses/{$feature->slug}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('admin_feature_accesses', [
            'user_id' => $employee->id,
            'feature_id' => $feature->id,
        ]);
    }

    public function test_member_cannot_be_targeted_as_admin_access_user(): void
    {
        $owner = $this->createUser('owner');
        $member = $this->createUser('member');
        $feature = $this->createFeature('employee.checkout');

        Sanctum::actingAs($owner);

        $this->postJson("/api/owner/admin-access/admins/{$member->id}/accesses", [
            'feature_id' => $feature->id,
            'permissions' => ['view'],
        ])
            ->assertNotFound()
            ->assertJsonPath('message', 'Admin tidak ditemukan');
    }

    public function test_employee_route_requires_matching_feature_access(): void
    {
        $employee = $this->createUser('employee');
        $feature = $this->createFeature('employee.menu_availability');

        Sanctum::actingAs($employee);

        $this->getJson('/api/employee/menus')
            ->assertForbidden()
            ->assertJsonPath('data.feature', 'employee.menu_availability')
            ->assertJsonPath('data.permission', 'view');

        AdminFeatureAccess::create([
            'user_id' => $employee->id,
            'feature_id' => $feature->id,
            'can_view' => true,
        ]);

        $this->getJson('/api/employee/menus')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data', []);
    }

    public function test_me_response_includes_assigned_feature_accesses(): void
    {
        $employee = $this->createUser('employee');
        $feature = $this->createFeature('employee.checkout');

        AdminFeatureAccess::create([
            'user_id' => $employee->id,
            'feature_id' => $feature->id,
            'can_view' => true,
            'can_create' => true,
        ]);

        Sanctum::actingAs($employee);

        $this->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.feature_accesses.0.slug', 'employee.checkout')
            ->assertJsonPath('data.feature_accesses.0.can_view', true)
            ->assertJsonPath('data.feature_accesses.0.can_create', true);
    }

    private function createUser(string $role): User
    {
        $this->phoneCounter++;

        return User::factory()->create([
            'phone' => '089900000' . str_pad((string) $this->phoneCounter, 3, '0', STR_PAD_LEFT),
            'address' => 'Jl. Test No. ' . $this->phoneCounter,
            'role' => $role,
            'status' => 'active',
        ]);
    }

    private function createFeature(string $slug): Feature
    {
        return Feature::create([
            'slug' => $slug,
            'name' => str_replace('.', ' ', $slug),
            'group' => str_starts_with($slug, 'owner.') ? 'Owner' : 'Employee',
            'description' => 'Feature test fixture',
            'is_active' => true,
        ]);
    }
}
