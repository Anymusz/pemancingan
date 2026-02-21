<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('transaction_code', 20)->unique();
            $table->unsignedBigInteger('arrival_id');           // NOT NULL — wajib ada arrival
            $table->decimal('total_amount', 10, 2);
            $table->decimal('discount_tier', 10, 2)->default(0);
            $table->decimal('final_amount', 10, 2);
            $table->decimal('tips', 10, 2)->default(0);
            $table->enum('payment_method', ['cash', 'transfer', 'qris']);
            $table->integer('points_earned')->default(0);
            $table->string('status')->default('paid');          // string agar mudah di-extend nanti
            $table->unsignedBigInteger('processed_by');
            $table->timestamp('transaction_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('arrival_id');
            $table->index('processed_by');
            $table->index('transaction_date');
            $table->index('status');

            // Foreign Keys
            $table->foreign('arrival_id')->references('id')->on('arrivals')->onDelete('restrict');
            $table->foreign('processed_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};