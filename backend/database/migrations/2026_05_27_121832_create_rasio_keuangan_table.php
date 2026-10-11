<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rasio_keuangan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('perusahaan_id')->constrained('perusahaan')->cascadeOnDelete();
            $table->year('tahun');

            // Presisi decimal(12,4) cukup untuk rasio dalam bentuk pecahan (mis. 0.1234)
            $table->decimal('roa', 12, 4)->nullable();
            $table->decimal('roe', 12, 4)->nullable();
            $table->decimal('npm', 12, 4)->nullable();
            $table->decimal('rasio_arus_kas_operasi', 12, 4)->nullable();
            $table->decimal('rasio_utang', 12, 4)->nullable();

            $table->timestamps();
            $table->unique(['perusahaan_id', 'tahun']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rasio_keuangan');
    }
};