<?php

namespace App\Services;

use App\Models\LaporanKeuangan;
use Illuminate\Support\Facades\DB;

class RatioService
{
    /**
     * Hitung rasio keuangan dari data laporan keuangan yang sudah dipublikasikan.
     * Dapat memproses satu tahun spesifik atau seluruh tahun sekaligus.
     *
     * Rasio yang dihitung:
     * - ROA: laba_bersih / total_aset * 100 (clamp -20% s/d 40%)
     * - ROE: laba_bersih / total_ekuitas * 100 (clamp -30% s/d 60%)
     * - NPM: laba_bersih / pendapatan * 100 (clamp -50% s/d 60%)
     * - Rasio Arus Kas Operasi: arus_kas_operasi / total_aset (clamp 0 s/d 0.30)
     * - DER: total_liabilitas / total_ekuitas (clamp min 0)
     *
     * @return int Jumlah baris laporan keuangan yang diproses
     */
    public function calculateRatios(?int $tahunFilter = null): int
    {
        $query = LaporanKeuangan::query()->where('status_data', 'dipublikasi');
        if ($tahunFilter) {
            $query->where('tahun', $tahunFilter);
        }

        $laporan = $query->get();

        if ($laporan->isEmpty()) {
            return 0;
        }

        $safeDiv = fn ($num, $den) => $den != 0 ? $num / $den : 0;
        $clamp = fn ($val, $min, $max) => max($min, min($max, $val));

        DB::transaction(function () use ($laporan, $tahunFilter, $safeDiv, $clamp) {
            if ($tahunFilter) {
                DB::table('rasio_keuangan')->where('tahun', $tahunFilter)->delete();
            } else {
                DB::table('rasio_keuangan')->delete();
            }

            $rasioData = [];

            foreach ($laporan as $item) {
                $roa = $clamp($safeDiv($item->laba_bersih, $item->total_aset) * 100, -20, 40);
                $roe = $clamp($safeDiv($item->laba_bersih, $item->total_ekuitas) * 100, -30, 60);
                $npm = $clamp($safeDiv($item->laba_bersih, $item->pendapatan) * 100, -50, 60);
                $kas = $clamp($safeDiv($item->arus_kas_operasi, $item->total_aset), 0, 0.30);
                $der = max(0, $safeDiv($item->total_liabilitas, $item->total_ekuitas));

                $rasioData[] = [
                    'perusahaan_id' => $item->perusahaan_id,
                    'tahun' => $item->tahun,
                    'roa' => round($roa, 4),
                    'roe' => round($roe, 4),
                    'npm' => round($npm, 4),
                    'rasio_arus_kas_operasi' => round($kas, 6),
                    'rasio_utang' => round($der, 4),
                ];
            }

            foreach (array_chunk($rasioData, 500) as $chunk) {
                DB::table('rasio_keuangan')->insert($chunk);
            }
        });

        return $laporan->count();
    }
}
