<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Perusahaan extends Model
{
    protected $table    = 'perusahaan';
    protected $fillable = ['kode_saham', 'nama_perusahaan', 'sektor'];

    public function laporanKeuangan()
    {
        return $this->hasMany(LaporanKeuangan::class);
    }
}