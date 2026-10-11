<?php

namespace App\Services;

use App\Models\LaporanKeuangan;
use App\Models\RasioKeuangan;

class RatioService
{
    /**
     * Hitung rasio keuangan untuk satu tahun dan simpan/update ke tabel rasio_keuangan.
     *
     * FIX: Formula diselaraskan dengan AnalitikController::hitungRasio agar
     * tidak ada dua versi yang menghasilkan angka berbeda:
     *
     *   - rasio_arus_kas_operasi = arus_kas_operasi / total_aset
     *     (bukan / total_liabilitas — total_liabilitas bisa = 0 untuk perusahaan
     *     tanpa utang, menghasilkan pembagi nol)
     *
     *   - rasio_utang = total_liabilitas / total_ekuitas  (DER sejati)
     *     (bukan / total_aset — itu adalah DAR, metrik yang berbeda dan tidak
     *     sesuai dengan label "DER" di kriteria C5)
     */
    public function calculateRatios(int $tahun): bool
    {
        $laporanList = LaporanKeuangan::where('tahun', $tahun)
                                      ->where('status_data', 'dipublikasi')
                                      ->get();

        if ($laporanList->isEmpty()) {
            return false;
        }

        foreach ($laporanList as $laporan) {
            $safeDiv = fn($num, $den) => $den != 0 ? $num / $den : 0;

            $roa = $safeDiv($laporan->laba_bersih,       $laporan->total_aset);
            $roe = $safeDiv($laporan->laba_bersih,       $laporan->total_ekuitas);
            $npm = $safeDiv($laporan->laba_bersih,       $laporan->pendapatan);

            // FIX: pakai total_aset sebagai penyebut (konsisten dengan AnalitikController)
            $rasio_arus_kas = $safeDiv($laporan->arus_kas_operasi, $laporan->total_aset);

            // FIX: DER = liabilitas / ekuitas (bukan / total_aset)
            $rasio_utang = $safeDiv($laporan->total_liabilitas, $laporan->total_ekuitas);

            RasioKeuangan::updateOrCreate(
                ['perusahaan_id' => $laporan->perusahaan_id, 'tahun' => $tahun],
                [
                    'roa'                    => $roa,
                    'roe'                    => $roe,
                    'npm'                    => $npm,
                    'rasio_arus_kas_operasi' => $rasio_arus_kas,
                    'rasio_utang'            => $rasio_utang,
                ]
            );
        }

        return true;
    }
}