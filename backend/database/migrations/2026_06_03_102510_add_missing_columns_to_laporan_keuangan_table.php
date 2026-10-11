<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('laporan_keuangan', function (Blueprint $table) {
            // Tambahkan kolom yang kurang setelah kolom jumlah_saham_beredar
            $table->decimal('harga_saham', 18, 2)->default(0)->after('jumlah_saham_beredar');
            $table->decimal('dividen', 18, 2)->default(0)->after('arus_kas_operasi');
            $table->string('skala_nominal')->default('Miliar')->after('dividen');
        });
    }

    public function down()
    {
        Schema::table('laporan_keuangan', function (Blueprint $table) {
            $table->dropColumn(['harga_saham', 'dividen', 'skala_nominal']);
        });
    }
};
