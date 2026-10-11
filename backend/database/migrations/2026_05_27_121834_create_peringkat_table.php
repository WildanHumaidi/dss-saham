<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('peringkat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('perusahaan_id')->constrained('perusahaan')->cascadeOnDelete();
            $table->year('tahun');

            // V_i: hasil akhir SAW (penjumlahan terbobot yang dinormalisasi)
            $table->decimal('nilai_preferensi', 10, 6);
            $table->integer('peringkat_ke');

            // Label interpretasi: 'Sangat Sehat' | 'Sehat' | 'Kurang Sehat'
            $table->string('status_kesehatan')->nullable();

            $table->timestamps();
            $table->unique(['perusahaan_id', 'tahun']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peringkat');
    }
};