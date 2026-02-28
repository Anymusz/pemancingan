<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restock_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fish_type_id')->constrained('fish_types')->restrictOnDelete();
            $table->decimal('quantity_kg', 10, 2);
            $table->decimal('stock_before', 10, 2);
            $table->decimal('stock_after', 10, 2);
            $table->foreignId('restocked_by')->constrained('users')->restrictOnDelete();
            $table->string('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restock_logs');
    }
};
