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

            $table->enum('item_type', ['fish', 'menu', 'rental', 'penalty']);

            $table->unsignedBigInteger('item_id')->nullable();
            $table->string('item_name_snapshot', 100);
            $table->decimal('quantity', 8, 2);
            $table->decimal('unit_price_snapshot', 10, 2);
            $table->decimal('subtotal', 10, 2);
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