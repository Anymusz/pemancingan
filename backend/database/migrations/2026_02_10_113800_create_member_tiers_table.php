// File: database/migrations/2024_01_01_000001_create_member_tiers_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('member_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 20)->unique()->comment('REGULAR, BRONZE, SILVER, GOLD');
            $table->unsignedInteger('min_points')->comment('Minimal poin untuk tier ini');
            $table->unsignedInteger('max_points')->nullable()->comment('Maksimal poin (NULL untuk GOLD = unlimited)');
            $table->decimal('discount_percentage', 5, 2)->default(0)->comment('Diskon dalam persen (0.00, 1.00, 3.00, 5.00)');
            $table->timestamps();

            // Indexes
            $table->index('min_points');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_tiers');
    }
};