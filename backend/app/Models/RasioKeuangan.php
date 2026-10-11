<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RasioKeuangan extends Model
{
    protected $table = 'rasio_keuangan';

    protected $fillable = [
        'perusahaan_id',
        'tahun',
        'roa',
        'roe',
        'npm',
        'rasio_arus_kas_operasi',
        'rasio_utang',
    ];

    protected $casts = [
        'tahun'                  => 'integer',
        'roa'                    => 'decimal:6',
        'roe'                    => 'decimal:6',
        'npm'                    => 'decimal:6',
        'rasio_arus_kas_operasi' => 'decimal:6',
        'rasio_utang'            => 'decimal:6',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function perusahaan(): BelongsTo
    {
        return $this->belongsTo(Perusahaan::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeTahun($query, int $tahun)
    {
        return $query->where('tahun', $tahun);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Kembalikan semua nilai rasio sebagai array asosiatif.
     * Berguna untuk memasukkan data ke SmartSawService tanpa
     * harus menyebut nama kolom satu per satu.
     */
    public function toRatioArray(): array
    {
        return [
            'roa'                    => (float) $this->roa,
            'roe'                    => (float) $this->roe,
            'npm'                    => (float) $this->npm,
            'rasio_arus_kas_operasi' => (float) $this->rasio_arus_kas_operasi,
            'rasio_utang'            => (float) $this->rasio_utang,
        ];
    }
}