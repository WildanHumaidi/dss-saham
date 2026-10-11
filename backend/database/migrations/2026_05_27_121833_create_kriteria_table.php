<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kriteria', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 5)->unique();       // C1, C2, …, C5
            $table->string('nama_kriteria');
            $table->enum('atribut', ['benefit', 'cost']); // penentu rumus normalisasi SAW

            // bobot_awal: nilai mentah dari analis (mis. 25.00 = 25%)
            // bobot_normalisasi: hasil pembagian SMART, jumlah semua = 1.0000
            $table->decimal('bobot_awal', 8, 2);
            $table->decimal('bobot_normalisasi', 8, 6)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kriteria');
    }
};