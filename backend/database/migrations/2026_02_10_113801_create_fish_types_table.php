// File: database/migrations/2024_01_01_000002_create_fish_types_table.php
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
        Schema::create('fish_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique()->comment('Nama jenis ikan: Patin, Gurame, Nila, Bawal');
            $table->decimal('price_per_kg', 10, 2)->comment('Harga per kilogram');
            $table->boolean('is_active')->default(true)->comment('Status ketersediaan');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fish_types');
    }
};