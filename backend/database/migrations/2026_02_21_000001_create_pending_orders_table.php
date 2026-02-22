<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pending_orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('arrival_id');

            // Fase 3C: menu & rental
            $table->enum('item_type', ['menu', 'rental']);

            $table->unsignedBigInteger('item_id')->nullable();
            $table->string('item_name_snapshot', 100);
            $table->unsignedSmallInteger('quantity');
            $table->decimal('unit_price_snapshot', 10, 2);
            $table->decimal('subtotal', 10, 2);

            $table->enum('payment_status', ['unpaid', 'paid'])->default('unpaid');
            $table->enum('order_source', ['self', 'manual']);

            $table->unsignedBigInteger('created_by')->nullable(); // null jika self-order
            $table->unsignedBigInteger('transaction_id')->nullable();

            $table->timestamps();

            $table->index('arrival_id');
            $table->index('payment_status');
            $table->index('transaction_id');

            $table->foreign('arrival_id')->references('id')->on('arrivals')->onDelete('restrict');
            $table->foreign('item_id')->references('id')->on('menus')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('transaction_id')->references('id')->on('transactions')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pending_orders');
    }
};