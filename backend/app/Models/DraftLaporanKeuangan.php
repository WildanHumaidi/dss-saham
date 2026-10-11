<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DraftLaporanKeuangan extends Model
{
    protected $table = 'draft_laporan_keuangan';

    protected $fillable = [
        'perusahaan_id', 'tahun', 'skala_nominal',
        'total_aset', 'total_liabilitas', 'total_ekuitas',
        'jumlah_saham_beredar', 'pendapatan', 'laba_bersih',
        'arus_kas_operasi', 'status_draft',
        'image_aset_path', 'image_liabilitas_path',
    ];

    /** Cek apakah draft sudah layak dipublikasi ke laporan_keuangan */
    public function isReadyToPublish(): bool
    {
        return ! is_null($this->total_aset)
            && ! is_null($this->total_liabilitas)
            && ! is_null($this->total_ekuitas);
    }

    public function perusahaan()
    {
        return $this->belongsTo(Perusahaan::class);
    }
}
