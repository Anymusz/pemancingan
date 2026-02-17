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
        Schema::create('members', function (Blueprint $table) {
            // Primary Key
            $table->id();
            
            // Foreign Key & Unique Identifier
            $table->unsignedBigInteger('user_id')->unique();
            $table->string('member_id', 11)->unique(); // Format: MBR + 8 random chars
            
            // Business Logic
            $table->foreignId('tier_id')->constrained('member_tiers')->onDelete('restrict');
            $table->integer('total_points')->default(0);
            $table->decimal('total_fish_weight', 10, 2)->default(0.00); // dalam kg
            
            // QR Code
            $table->string('qr_code_hash', 100)->unique(); // UUID untuk filename
            
            // Tracking
            $table->timestamp('last_transaction_date')->nullable();
            $table->timestamp('approved_at'); // Kapan di-approve oleh owner
            
            // Timestamps
            $table->timestamps();
            
            // Foreign Key Constraint
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};