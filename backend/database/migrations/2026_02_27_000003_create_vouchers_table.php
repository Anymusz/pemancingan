<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->enum('source', ['leaderboard'])->default('leaderboard');
            $table->tinyInteger('rank');
            $table->smallInteger('period_year');
            $table->tinyInteger('period_month');
            $table->enum('status', ['unused', 'used'])->default('unused');
            $table->timestamp('used_at')->nullable();
            $table->foreignId('transaction_id')->nullable()->constrained('transactions')->nullOnDelete();
            $table->timestamp('issued_at');
            $table->timestamps();

            // Unique constraints
            $table->unique(['period_year', 'period_month', 'rank']);
            $table->unique(['member_id', 'period_year', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
