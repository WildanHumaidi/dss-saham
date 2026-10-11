<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kriteria extends Model
{
    protected $table = 'kriteria';

    protected $fillable = [
        'kode', 'nama_kriteria', 'atribut',
        'bobot_awal', 'bobot_normalisasi',
    ];
}
