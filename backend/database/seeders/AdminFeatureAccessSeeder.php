<?php

namespace Database\Seeders;

use App\Models\AdminFeatureAccess;
use App\Models\Feature;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminFeatureAccessSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employeeFeatureIds = Feature::where('slug', 'like', 'employee.%')->pluck('id');
        $employees = User::where('role', 'employee')->where('status', 'active')->get();

        foreach ($employees as $employee) {
            foreach ($employeeFeatureIds as $featureId) {
                AdminFeatureAccess::updateOrCreate(
                    [
                        'user_id' => $employee->id,
                        'feature_id' => $featureId,
                    ],
                    [
                        'can_view' => true,
                        'can_create' => true,
                        'can_update' => true,
                        'can_delete' => true,
                        'granted_by' => null,
                    ]
                );
            }
        }
    }
}
