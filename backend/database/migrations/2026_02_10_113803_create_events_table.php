// File: database/migrations/2024_01_01_000004_create_events_table.php
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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255)->comment('Judul event/informasi');
            $table->text('description')->comment('Konten/deskripsi lengkap');
            $table->enum('category', ['event', 'info'])->comment('Kategori: event atau info');
            $table->date('start_date')->nullable()->comment('Tanggal mulai (nullable untuk info umum)');
            $table->date('end_date')->nullable()->comment('Tanggal berakhir');
            $table->enum('status', ['draft', 'published'])->default('draft')->comment('Status publikasi');
            $table->timestamps();

            // Indexes untuk query cepat
            $table->index('status');
            $table->index('start_date');
            $table->index('end_date');
            $table->index(['status', 'start_date']); // Composite index untuk filter published + date
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};