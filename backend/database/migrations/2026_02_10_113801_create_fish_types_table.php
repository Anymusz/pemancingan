<?php
// File: database/migrations/2026_02_10_113801_create_fish_types_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fish_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique()->comment('Nama jenis ikan: Patin, Gurame, Nila, Bawal');
            $table->decimal('price_per_kg', 10, 2)->comment('Harga per kilogram');
            $table->boolean('is_active')->default(true)->comment('Status ketersediaan');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fish_types');
    }
};