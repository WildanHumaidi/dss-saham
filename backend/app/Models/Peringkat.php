<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Peringkat extends Model
{
    use HasFactory;

    protected $table = 'peringkat'; // Tanpa 's'

    protected $fillable = [
        'perusahaan_id',
        'tahun',
        'nilai_preferensi',
        'peringkat_ke',
        'status_kesehatan',
    ];

    public function perusahaan()
    {
        return $this->belongsTo(Perusahaan::class);
    }
}
