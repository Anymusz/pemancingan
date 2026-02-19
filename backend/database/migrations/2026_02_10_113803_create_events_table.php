<?php
// File: database/migrations/2026_02_10_113803_create_events_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255)->comment('Judul event/informasi');
            $table->text('description')->comment('Konten/deskripsi lengkap');
            $table->enum('category', ['event', 'info'])->comment('Kategori: event atau info');
            $table->date('start_date')->nullable()->comment('Tanggal mulai (nullable untuk info umum)');
            $table->date('end_date')->nullable()->comment('Tanggal berakhir');
            $table->enum('status', ['draft', 'published'])->default('draft')->comment('Status publikasi');
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('start_date');
            $table->index('end_date');
            $table->index(['status', 'start_date']);
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};