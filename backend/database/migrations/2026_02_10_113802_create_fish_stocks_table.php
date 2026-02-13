// File: database/migrations/2024_01_01_000003_create_fish_stocks_table.php
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
        Schema::create('fish_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fish_type_id')
                  ->unique()
                  ->constrained('fish_types')
                  ->cascadeOnUpdate()
                  ->restrictOnDelete()
                  ->comment('Satu jenis ikan hanya boleh punya 1 record stok');
            $table->decimal('current_stock_kg', 10, 2)->default(0)->comment('Stok saat ini dalam kilogram');
            $table->decimal('alert_threshold_kg', 10, 2)->default(0)->comment('Batas minimal untuk alert');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fish_stocks');
    }
};