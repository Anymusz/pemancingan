<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::dropIfExists('admin_feature_accesses');
        Schema::dropIfExists('features');
    }

    public function down(): void
    {
        // Intentionally left empty: employee access is role-based only.
    }
};
