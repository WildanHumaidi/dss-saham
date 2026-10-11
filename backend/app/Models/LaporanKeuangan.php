<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LaporanKeuangan extends Model
{
    protected $table    = 'laporan_keuangan';
    protected $fillable = [
        'perusahaan_id', 'tahun',
        'total_aset', 'total_liabilitas', 'total_ekuitas',
        'jumlah_saham_beredar', 'harga_saham',
        'pendapatan', 'laba_bersih', 'arus_kas_operasi',
        'dividen', 'skala_nominal', 'status_data',
    ];

    public function perusahaan()
    {
        return $this->belongsTo(Perusahaan::class);
    }
}