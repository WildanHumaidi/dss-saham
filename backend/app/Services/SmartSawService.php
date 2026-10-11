<?php

namespace App\Services;

use App\Models\RasioKeuangan;
use App\Models\Kriteria;
use App\Models\Peringkat;

class SmartSawService
{
    public function calculateRanking($tahun)
    {
        // 1. TAHAP SMART: Normalisasi Bobot Kriteria
        $kriteriaList = Kriteria::all();
        $totalBobotAwal = $kriteriaList->sum('bobot_awal');

        $bobot = [];
        foreach ($kriteriaList as $kriteria) {
            // Rumus SMART: Wj = wj / sum(wj)
            $nilaiNormalisasi = $kriteria->bobot_awal / $totalBobotAwal;
            
            $kriteria->update(['bobot_normalisasi' => $nilaiNormalisasi]);
            $bobot[$kriteria->kode] = [
                'nilai' => $nilaiNormalisasi,
                'atribut' => $kriteria->atribut
            ];
        }

        // 2. TAHAP SAW: Normalisasi Matriks Keputusan
        $rasioList = RasioKeuangan::where('tahun', $tahun)->get();

        if ($rasioList->isEmpty()) {
            return false; // Tidak ada data untuk dihitung
        }

        // Cari Nilai Max dan Min untuk setiap kriteria di tahun tersebut
        $maxMin = [
            'roa' => ['max' => $rasioList->max('roa'), 'min' => $rasioList->min('roa')],
            'roe' => ['max' => $rasioList->max('roe'), 'min' => $rasioList->min('roe')],
            'npm' => ['max' => $rasioList->max('npm'), 'min' => $rasioList->min('npm')],
            'rasio_arus_kas_operasi' => ['max' => $rasioList->max('rasio_arus_kas_operasi'), 'min' => $rasioList->min('rasio_arus_kas_operasi')],
            'rasio_utang' => ['max' => $rasioList->max('rasio_utang'), 'min' => $rasioList->min('rasio_utang')],
        ];

        $hasilPeringkat = [];

        foreach ($rasioList as $rasio) {
            $nilaiPreferensi = 0;

            // Pemetaan nilai rasio ke dalam array untuk dilooping berdasarkan Kriteria
            $nilaiAlternatif = [
                'C1' => $rasio->roa, // Asumsi C1 adalah ROA (Benefit)
                'C2' => $rasio->roe, // Asumsi C2 adalah ROE (Benefit)
                'C3' => $rasio->npm, // Asumsi C3 adalah NPM (Benefit)
                'C4' => $rasio->rasio_arus_kas_operasi, // Asumsi C4 (Benefit)
                'C5' => $rasio->rasio_utang, // Asumsi C5 adalah Rasio Utang (Cost)
            ];

            // Mapping kriteria code ke nama kolom untuk ambil nilai Max/Min
            $kodeToColumn = ['C1' => 'roa', 'C2' => 'roe', 'C3' => 'npm', 'C4' => 'rasio_arus_kas_operasi', 'C5' => 'rasio_utang'];

            foreach ($bobot as $kode => $pengaturan) {
                $kolom = $kodeToColumn[$kode];
                $nilaiX = $nilaiAlternatif[$kode];
                $r_ij = 0;

                // Rumus Normalisasi SAW
                if ($pengaturan['atribut'] == 'benefit') {
                    $r_ij = $maxMin[$kolom]['max'] > 0 ? ($nilaiX / $maxMin[$kolom]['max']) : 0;
                } elseif ($pengaturan['atribut'] == 'cost') {
                    $r_ij = $nilaiX > 0 ? ($maxMin[$kolom]['min'] / $nilaiX) : 0;
                }

                // Rumus Nilai Preferensi Akhir (Vi)
                $nilaiPreferensi += ($pengaturan['nilai'] * $r_ij);
            }

            // Simpan sementara di array untuk di-sorting
            $hasilPeringkat[] = [
                'perusahaan_id' => $rasio->perusahaan_id,
                'tahun' => $tahun,
                'nilai_preferensi' => $nilaiPreferensi,
            ];
        }

        // 3. TAHAP PERANGKINGAN (Sorting dari nilai terbesar ke terkecil)
        usort($hasilPeringkat, function ($a, $b) {
            return $b['nilai_preferensi'] <=> $a['nilai_preferensi'];
        });

        // 4. SIMPAN KE TABEL PERINGKAT
        $peringkatKe = 1;
        foreach ($hasilPeringkat as $hasil) {
            // Tentukan status kesehatan berdasarkan nilai (Opsional/Bisa disesuaikan)
            $status = 'Kurang Sehat';
            if ($hasil['nilai_preferensi'] >= 0.8) $status = 'Sangat Sehat';
            elseif ($hasil['nilai_preferensi'] >= 0.6) $status = 'Sehat';

            Peringkat::updateOrCreate(
                ['perusahaan_id' => $hasil['perusahaan_id'], 'tahun' => $tahun],
                [
                    'nilai_preferensi' => $hasil['nilai_preferensi'],
                    'peringkat_ke' => $peringkatKe,
                    'status_kesehatan' => $status
                ]
            );
            $peringkatKe++;
        }

        return true;
    }
}