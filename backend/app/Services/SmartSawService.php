<?php

namespace App\Services;

use App\Models\Kriteria;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class SmartSawService
{
    /**
     * Jalankan tahapan normalisasi SMART (bobot) dan SAW (matriks keputusan & ranking).
     *
     * @return int Jumlah total baris peringkat yang dihasilkan
     *
     * @throws RuntimeException Jika data rasio atau kriteria kosong
     * @throws InvalidArgumentException Jika total bobot kriteria <= 0
     */
    public function calculateAllRankings(): int
    {
        $dataRasio = DB::table('rasio_keuangan')->get();

        if ($dataRasio->isEmpty()) {
            throw new RuntimeException('Hitung rasio dulu!');
        }

        $kriteria = Kriteria::all();
        if ($kriteria->isEmpty()) {
            throw new RuntimeException('Data kriteria belum ada! Tambahkan kriteria terlebih dahulu.');
        }

        // 1. TAHAP SMART: Normalisasi Bobot Kriteria
        $totalBobot = (float) $kriteria->sum('bobot_awal');
        if ($totalBobot <= 0) {
            throw new InvalidArgumentException('Total bobot kriteria harus lebih besar dari 0!');
        }

        foreach ($kriteria as $k) {
            $k->bobot_normalisasi = $k->bobot_awal / $totalBobot;
            $k->save();
        }

        $bobot = $kriteria->pluck('bobot_normalisasi', 'kode');

        // 2. TAHAP SAW: Normalisasi Matriks Keputusan & Perangkingan per Tahun
        $totalInserted = 0;

        DB::transaction(function () use ($dataRasio, $bobot, &$totalInserted) {
            DB::table('peringkat')->delete();

            $insertData = [];
            $groupedByYear = $dataRasio->groupBy('tahun');
            $derFloor = 0.05;

            foreach ($groupedByYear as $tahun => $rasioTahun) {
                $clampBenefit = fn ($val, $cap) => max(0, min($val, $cap));

                $maxMin = [
                    'roa' => max(0.0001, $clampBenefit($rasioTahun->max('roa'), 40)),
                    'roe' => max(0.0001, $clampBenefit($rasioTahun->max('roe'), 60)),
                    'npm' => max(0.0001, $clampBenefit($rasioTahun->max('npm'), 60)),
                    'kas' => max(0.0001, $clampBenefit($rasioTahun->max('rasio_arus_kas_operasi'), 0.30)),
                    // Floor diterapkan ke SETIAP nilai DER dulu, baru dicari minimumnya
                    'der' => $rasioTahun->map(fn ($r) => max($r->rasio_utang, $derFloor))->min(),
                ];

                $hasilTahun = [];

                foreach ($rasioTahun as $row) {
                    $roa_val = $clampBenefit($row->roa, 40);
                    $roe_val = $clampBenefit($row->roe, 60);
                    $npm_val = $clampBenefit($row->npm, 60);
                    $kas_val = $clampBenefit($row->rasio_arus_kas_operasi, 0.30);
                    $der_val = max($row->rasio_utang, $derFloor);

                    $n_roa = $maxMin['roa'] > 0 ? $roa_val / $maxMin['roa'] : 0;
                    $n_roe = $maxMin['roe'] > 0 ? $roe_val / $maxMin['roe'] : 0;
                    $n_npm = $maxMin['npm'] > 0 ? $npm_val / $maxMin['npm'] : 0;
                    $n_kas = $maxMin['kas'] > 0 ? $kas_val / $maxMin['kas'] : 0;
                    $n_der = $der_val > 0 ? $maxMin['der'] / $der_val : 0;

                    $nilai_v =
                        ($n_roa * ($bobot['C1'] ?? 0.25)) +
                        ($n_roe * ($bobot['C2'] ?? 0.25)) +
                        ($n_npm * ($bobot['C3'] ?? 0.20)) +
                        ($n_kas * ($bobot['C4'] ?? 0.15)) +
                        ($n_der * ($bobot['C5'] ?? 0.15));

                    $hasilTahun[] = [
                        'perusahaan_id' => $row->perusahaan_id,
                        'tahun' => $tahun,
                        'nilai' => $nilai_v,
                    ];
                }

                // 3. TAHAP PERANGKINGAN (Sorting dari nilai terbesar ke terkecil)
                usort($hasilTahun, fn ($a, $b) => $b['nilai'] <=> $a['nilai']);

                foreach ($hasilTahun as $index => $hasil) {
                    $insertData[] = [
                        'perusahaan_id' => $hasil['perusahaan_id'],
                        'tahun' => $tahun,
                        'nilai_preferensi' => $hasil['nilai'],
                        'peringkat_ke' => $index + 1,
                        'status_kesehatan' => $hasil['nilai'] >= 0.8
                            ? 'Sangat Sehat'
                            : ($hasil['nilai'] >= 0.6 ? 'Sehat' : 'Kurang Sehat'),
                    ];
                }
            }

            foreach (array_chunk($insertData, 500) as $chunk) {
                DB::table('peringkat')->insert($chunk);
            }

            $totalInserted = count($insertData);
        });

        return $totalInserted;
    }
}
