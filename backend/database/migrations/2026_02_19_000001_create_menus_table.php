// File: database/migrations/2026_02_19_000001_create_menus_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('menus', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 100);
            $table->decimal('price', 10, 2);
            $table->enum('category', ['food', 'beverage']);
            $table->enum('availability', ['available', 'unavailable'])->default('available');
            $table->boolean('is_special')->default(false);
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('category');
            $table->index('availability');
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menus');
    }
};