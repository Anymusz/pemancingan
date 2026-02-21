<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('transaction_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('transaction_id');

            // Fase 3B: Hanya 'fish' yang aktif digunakan
            // 'menu' & 'equipment_rental' untuk fase pending orders (belum diimplementasi)
            $table->enum('item_type', ['fish', 'menu', 'equipment_rental']);

            $table->unsignedBigInteger('item_id')->nullable(); // Nullable: item bisa soft deleted
            $table->string('item_name_snapshot', 100);         // Historical record
            $table->decimal('quantity', 8, 2);                 // Ikan: kg, Menu: qty
            $table->decimal('unit_price_snapshot', 10, 2);     // Historical record
            $table->decimal('subtotal', 10, 2);                // quantity × unit_price
            $table->timestamps();

            $table->index('transaction_id');
            $table->index('item_type');
            $table->index('item_id');

            $table->foreign('transaction_id')->references('id')->on('transactions')->onDelete('cascade');
            // Tidak FK ke fish_types/menus karena soft delete
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_items');
    }
};