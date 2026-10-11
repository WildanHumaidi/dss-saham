<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laporan_keuangan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('perusahaan_id')->constrained('perusahaan')->cascadeOnDelete();
            $table->year('tahun');

            // ── Neraca ──
            $table->decimal('total_aset', 18, 2);
            $table->decimal('total_liabilitas', 18, 2);
            $table->decimal('total_ekuitas', 18, 2);

            // ── Laba Rugi & Arus Kas ──
            $table->decimal('jumlah_saham_beredar', 18, 2);
            $table->decimal('pendapatan', 18, 2);
            $table->decimal('laba_bersih', 18, 2);
            $table->decimal('arus_kas_operasi', 18, 2);

            $table->enum('status_data', ['draft', 'direview', 'dipublikasi'])->default('draft');

            $table->timestamps();
            $table->unique(['perusahaan_id', 'tahun']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laporan_keuangan');
    }
};
