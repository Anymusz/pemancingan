<?php
// File: database/migrations/2026_02_19_000002_create_arrivals_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('arrivals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('member_id')->nullable();
            $table->string('guest_name')->nullable();
            $table->decimal('deposit_amount', 10, 2)->default(0);
            $table->timestamp('check_in_at');
            $table->timestamp('check_out_at')->nullable();
            $table->enum('status', ['active', 'completed'])->default('active');
            $table->unsignedBigInteger('checked_in_by');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('member_id');
            $table->index('check_in_at');
            $table->index('status');
            $table->index('checked_in_by');
            $table->index(['member_id', 'status']);

            $table->foreign('member_id')->references('id')->on('members')->onDelete('cascade');
            $table->foreign('checked_in_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('arrivals');
    }
};