<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop unique constraint dulu
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_email_unique');
        });

        // Modify column jadi nullable
        DB::statement('ALTER TABLE users MODIFY email VARCHAR(255) NULL');

        // Add unique constraint kembali
        Schema::table('users', function (Blueprint $table) {
            $table->unique('email');
        });
    }

    public function down(): void
    {
        // Drop unique constraint
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email']);
        });

        // Modify column jadi NOT NULL
        DB::statement('ALTER TABLE users MODIFY email VARCHAR(255) NOT NULL');

        // Add unique constraint kembali
        Schema::table('users', function (Blueprint $table) {
            $table->unique('email');
        });
    }
};