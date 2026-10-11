<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('draft_laporan_keuangan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('perusahaan_id')->constrained('perusahaan')->cascadeOnDelete();
            $table->year('tahun');
            $table->string('skala_nominal')->default('Miliar');

            // Semua field nullable: data dicicil (Aset → Liabilitas → Ekuitas → dst.)
            $table->decimal('total_aset', 18, 2)->nullable();
            $table->decimal('total_liabilitas', 18, 2)->nullable();
            $table->decimal('total_ekuitas', 18, 2)->nullable();
            $table->decimal('jumlah_saham_beredar', 18, 2)->nullable();
            $table->decimal('pendapatan', 18, 2)->nullable();
            $table->decimal('laba_bersih', 18, 2)->nullable();
            $table->decimal('arus_kas_operasi', 18, 2)->nullable();

            // incomplete → ready_for_review (neraca lengkap) → verified (sudah publish)
            $table->enum('status_draft', ['incomplete', 'ready_for_review', 'verified'])->default('incomplete');

            $table->string('image_aset_path')->nullable();
            $table->string('image_liabilitas_path')->nullable();

            $table->timestamps();
            $table->unique(['perusahaan_id', 'tahun']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('draft_laporan_keuangan');
    }
};