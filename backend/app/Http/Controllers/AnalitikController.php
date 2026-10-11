<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LaporanKeuangan;
use App\Models\Perusahaan;
use App\Models\Kriteria;
use Illuminate\Support\Facades\DB;

class AnalitikController extends Controller
{
    // =========================================================================
    // 1. SCREENER SAHAM (VALUE INVESTING)
    // FIX: hanya pakai data berstatus 'dipublikasi' — sebelumnya semua status
    //      (termasuk draft yang belum direview admin) ikut ditampilkan publik.
    // FIX: default tahun tidak lagi hardcode 2025 — otomatis pakai tahun
    //      terbaru dari data yang sudah dipublikasikan.
    // =========================================================================
    public function getScreener(Request $request)
    {
        $tahun = $request->query('tahun');

        if (!$tahun) {
            $tahun = LaporanKeuangan::where('status_data', 'dipublikasi')->max('tahun');
        }

        if (!$tahun) {
            return response()->json(['status' => 'success', 'data' => []]);
        }

        $laporan = LaporanKeuangan::with('perusahaan')
            ->where('tahun', $tahun)
            ->where('status_data', 'dipublikasi')
            ->get();

        $screenerData = $laporan->map(function ($item) {
            $safeDiv = fn($num, $den) => $den != 0 ? $num / $den : 0;

            $eps  = $safeDiv($item->laba_bersih, $item->jumlah_saham_beredar);
            $bvps = $safeDiv($item->total_ekuitas, $item->jumlah_saham_beredar);
            $per  = $safeDiv($item->harga_saham, $eps);
            $pbv  = $safeDiv($item->harga_saham, $bvps);
            $roe  = $safeDiv($item->laba_bersih, $item->total_ekuitas) * 100;
            $der  = $safeDiv($item->total_liabilitas, $item->total_ekuitas);

            return [
                'id'              => $item->id,
                'kode_saham'      => $item->perusahaan->kode_saham,
                'nama_perusahaan' => $item->perusahaan->nama_perusahaan,
                'harga_saham'     => $item->harga_saham,
                'eps'             => round($eps, 2),
                'bvps'            => round($bvps, 2),
                'per'             => round($per, 2),
                'pbv'             => round($pbv, 2),
                'roe'             => round($roe, 2),
                'der'             => round($der, 2),
            ];
        });

        return response()->json(['status' => 'success', 'data' => $screenerData]);
    }

    // =========================================================================
    // 2. HITUNG RASIO KEUANGAN & SIMPAN KE TABEL 'rasio_keuangan'
    // FIX: hanya pakai data berstatus 'dipublikasi' — sebelumnya SEMUA status
    //      (termasuk draft yang belum direview) ikut dihitung dan memengaruhi
    //      ranking publik.
    // FIX: dibungkus DB::transaction() — sebelumnya delete lalu insert
    //      dilakukan terpisah tanpa transaksi; kalau insert gagal di tengah
    //      (mis. chunk ke-3 dari 5), tabel rasio_keuangan bisa tertinggal
    //      kosong/separuh tanpa rollback otomatis.
    // =========================================================================
    public function hitungRasio(Request $request)
    {
        // Opsional: filter per tahun tertentu. Jika tidak diisi → hitung semua.
        $tahunFilter = $request->input('tahun');

        $query = LaporanKeuangan::query()->where('status_data', 'dipublikasi');
        if ($tahunFilter) {
            $query->where('tahun', $tahunFilter);
        }

        $laporan = $query->get();

        if ($laporan->isEmpty()) {
            return response()->json([
                'message' => 'Tidak ada data berstatus "dipublikasi" untuk dihitung. '
                    . 'Publikasikan data lewat menu Draft atau Admin terlebih dahulu.',
            ], 404);
        }

        $safeDiv = fn($num, $den) => $den != 0 ? $num / $den : 0;
        $clamp   = fn($val, $min, $max) => max($min, min($max, $val));

        DB::transaction(function () use ($laporan, $tahunFilter, $safeDiv, $clamp) {
            // Hapus hanya untuk tahun yang akan dihitung ulang,
            // bukan seluruh tabel, agar data historis tahun lain tetap aman.
            if ($tahunFilter) {
                DB::table('rasio_keuangan')->where('tahun', $tahunFilter)->delete();
            } else {
                DB::table('rasio_keuangan')->delete();
            }

            $rasioData = [];

            foreach ($laporan as $item) {
                // ── ROA: laba_bersih / total_aset × 100 — wajar -20% s/d 40%
                $roa = $clamp($safeDiv($item->laba_bersih, $item->total_aset) * 100, -20, 40);

                // ── ROE: laba_bersih / total_ekuitas × 100 — wajar -30% s/d 60%
                $roe = $clamp($safeDiv($item->laba_bersih, $item->total_ekuitas) * 100, -30, 60);

                // ── NPM: laba_bersih / pendapatan × 100 — wajar -50% s/d 60%
                $npm = $clamp($safeDiv($item->laba_bersih, $item->pendapatan) * 100, -50, 60);

                // ── Rasio Arus Kas Operasi: arus_kas_operasi / total_aset — wajar 0 s/d 0.30
                $kas = $clamp($safeDiv($item->arus_kas_operasi, $item->total_aset), 0, 0.30);

                // ── DER: total_liabilitas / total_ekuitas (DER sejati, konsisten
                //    dengan kriteria C5 dan RatioService). Clamp min 0.
                $der = max(0, $safeDiv($item->total_liabilitas, $item->total_ekuitas));

                $rasioData[] = [
                    'perusahaan_id'          => $item->perusahaan_id,
                    'tahun'                  => $item->tahun,
                    'roa'                    => round($roa, 4),
                    'roe'                    => round($roe, 4),
                    'npm'                    => round($npm, 4),
                    'rasio_arus_kas_operasi' => round($kas, 6),
                    'rasio_utang'            => round($der, 4),
                ];
            }

            foreach (array_chunk($rasioData, 500) as $chunk) {
                DB::table('rasio_keuangan')->insert($chunk);
            }
        });

        $label = $tahunFilter ? "tahun {$tahunFilter}" : "seluruh tahun";
        return response()->json(['message' => "Rasio {$label} berhasil dihitung dari data yang sudah dipublikasikan!"]);
    }

    // =========================================================================
    // 3. HITUNG PERINGKAT SAW (SEMUA TAHUN OTOMATIS)
    // FIX: bug normalisasi DER — floor 0.05 sebelumnya diterapkan hanya ke
    //      nilai minimum grup (pembilang), sehingga saat DER asli terkecil
    //      di suatu tahun < 0.05, n_der = pembilang/penyebut bisa > 1
    //      (skor SAW "meledak" melebihi batas wajar 0..1). Sekarang floor
    //      diterapkan KONSISTEN ke kedua sisi (nilai minimum grup maupun
    //      nilai per-baris) sebelum pembagian, sehingga n_der selalu <= 1,
    //      sekaligus floor tetap berfungsi mencegah satu emiten dengan DER
    //      mendekati nol "menghancurkan" skor semua emiten lain.
    // FIX: dibungkus DB::transaction() dengan alasan yang sama seperti
    //      hitungRasio().
    // =========================================================================
    public function hitungPeringkat()
    {
        $dataRasio = DB::table('rasio_keuangan')->get();

        if ($dataRasio->isEmpty()) {
            return response()->json(['message' => 'Hitung rasio dulu!'], 400);
        }

        $kriteria = Kriteria::all();
        if ($kriteria->isEmpty()) {
            return response()->json(['message' => 'Data kriteria belum ada! Tambahkan kriteria terlebih dahulu.'], 400);
        }

        $totalBobot = (float) $kriteria->sum('bobot_awal');
        if ($totalBobot <= 0) {
            return response()->json(['message' => 'Total bobot kriteria harus lebih besar dari 0!'], 422);
        }

        foreach ($kriteria as $k) {
            $k->bobot_normalisasi = $k->bobot_awal / $totalBobot;
            $k->save();
        }

        $bobot = $kriteria->pluck('bobot_normalisasi', 'kode');

        DB::transaction(function () use ($dataRasio, $bobot) {
            DB::table('peringkat')->delete();

            $insertData    = [];
            $groupedByYear = $dataRasio->groupBy('tahun');
            $derFloor      = 0.05;

            foreach ($groupedByYear as $tahun => $rasioTahun) {

                $clampBenefit = fn($val, $cap) => max(0, min($val, $cap));

                $maxMin = [
                    'roa' => max(0.0001, $clampBenefit($rasioTahun->max('roa'), 40)),
                    'roe' => max(0.0001, $clampBenefit($rasioTahun->max('roe'), 60)),
                    'npm' => max(0.0001, $clampBenefit($rasioTahun->max('npm'), 60)),
                    'kas' => max(0.0001, $clampBenefit($rasioTahun->max('rasio_arus_kas_operasi'), 0.30)),
                    // Floor diterapkan ke SETIAP nilai DER dulu, baru dicari
                    // minimumnya — bukan floor terhadap nilai minimum mentah.
                    'der' => $rasioTahun->map(fn($r) => max($r->rasio_utang, $derFloor))->min(),
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
                    // n_der selalu <= 1 karena maxMin['der'] adalah nilai
                    // TERKECIL dari himpunan yang sama-sama sudah di-floor
                    // seperti $der_val.
                    $n_der = $der_val > 0 ? $maxMin['der'] / $der_val : 0;

                    $nilai_v =
                        ($n_roa * ($bobot['C1'] ?? 0.25)) +
                        ($n_roe * ($bobot['C2'] ?? 0.25)) +
                        ($n_npm * ($bobot['C3'] ?? 0.20)) +
                        ($n_kas * ($bobot['C4'] ?? 0.15)) +
                        ($n_der * ($bobot['C5'] ?? 0.15));

                    $hasilTahun[] = [
                        'perusahaan_id' => $row->perusahaan_id,
                        'tahun'         => $tahun,
                        'nilai'         => $nilai_v,
                    ];
                }

                usort($hasilTahun, fn($a, $b) => $b['nilai'] <=> $a['nilai']);

                foreach ($hasilTahun as $index => $hasil) {
                    $insertData[] = [
                        'perusahaan_id'    => $hasil['perusahaan_id'],
                        'tahun'            => $tahun,
                        'nilai_preferensi' => $hasil['nilai'],
                        'peringkat_ke'     => $index + 1,
                        'status_kesehatan' => $hasil['nilai'] >= 0.8
                            ? 'Sangat Sehat'
                            : ($hasil['nilai'] >= 0.6 ? 'Sehat' : 'Kurang Sehat'),
                    ];
                }
            }

            foreach (array_chunk($insertData, 500) as $chunk) {
                DB::table('peringkat')->insert($chunk);
            }
        });

        return response()->json(['message' => 'Peringkat seluruh periode historis selesai dihitung!']);
    }

    // =========================================================================
    // 4. API BANTUAN UNTUK FRONTEND
    // =========================================================================

    public function getHasilPeringkat($tahun)
    {
        if ($tahun === 'all') {
            $data = DB::table('peringkat')
                ->join('perusahaan', 'peringkat.perusahaan_id', '=', 'perusahaan.id')
                ->select(
                    'perusahaan.id as perusahaan_id',
                    'perusahaan.kode_saham',
                    'perusahaan.nama_perusahaan',
                    'perusahaan.sektor',
                    DB::raw('AVG(peringkat.nilai_preferensi) as nilai_preferensi')
                )
                ->groupBy(
                    'perusahaan.id',
                    'perusahaan.kode_saham',
                    'perusahaan.nama_perusahaan',
                    'perusahaan.sektor'
                )
                ->orderBy('nilai_preferensi', 'desc')
                ->get();

            $data = $data->map(function ($item, $key) {
                $item->peringkat_ke     = $key + 1;
                $item->status_kesehatan = $item->nilai_preferensi >= 0.8
                    ? 'Sangat Sehat'
                    : ($item->nilai_preferensi >= 0.6 ? 'Sehat' : 'Kurang Sehat');
                return $item;
            });

            return response()->json(['data' => $data]);
        }

        $data = DB::table('peringkat')
            ->join('perusahaan', 'peringkat.perusahaan_id', '=', 'perusahaan.id')
            ->where('peringkat.tahun', $tahun)
            ->select('peringkat.*', 'perusahaan.kode_saham', 'perusahaan.nama_perusahaan', 'perusahaan.sektor')
            ->orderBy('peringkat.peringkat_ke', 'asc')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function getTrenPeringkat()
    {
        $top3 = DB::table('peringkat')
            ->select('perusahaan_id', DB::raw('AVG(nilai_preferensi) as avg_skor'))
            ->groupBy('perusahaan_id')
            ->orderByDesc('avg_skor')
            ->limit(3)
            ->pluck('perusahaan_id');

        $perusahaans = Perusahaan::whereIn('id', $top3)->get()->keyBy('id');

        $tren = DB::table('peringkat')
            ->whereIn('perusahaan_id', $top3)
            ->orderBy('tahun')
            ->get();

        $formatted = [];
        foreach ($tren->groupBy('tahun') as $tahun => $rows) {
            $row = ['year' => $tahun];
            foreach ($rows as $r) {
                $kode       = $perusahaans[$r->perusahaan_id]->kode_saham ?? '?';
                $row[$kode] = round($r->nilai_preferensi, 4);
            }
            $formatted[] = $row;
        }

        return response()->json([
            'data' => $formatted,
            'keys' => $perusahaans->pluck('kode_saham')->values()->toArray(),
        ]);
    }

    /**
     * GET /api/analitik/rasio/all  (ditangani closure di api.php)
     * GET /api/analitik/rasio/{tahun}
     *
     * FIX: mode 'all' sebelumnya hanya meng-AVG roa, roe, rasio_utang —
     *      npm dan rasio_arus_kas_operasi hilang, tidak konsisten dengan
     *      mode per-tahun yang menyertakan kelima rasio.
     */
    public function getRasioData($tahun)
    {
        $query = DB::table('rasio_keuangan')
            ->join('perusahaan', 'rasio_keuangan.perusahaan_id', '=', 'perusahaan.id');

        if ($tahun === 'all') {
            $query->select(
                'perusahaan.kode_saham',
                'perusahaan.nama_perusahaan',
                DB::raw('AVG(roa) as roa'),
                DB::raw('AVG(roe) as roe'),
                DB::raw('AVG(npm) as npm'),
                DB::raw('AVG(rasio_arus_kas_operasi) as rasio_arus_kas_operasi'),
                DB::raw('AVG(rasio_utang) as rasio_utang')
            )
            ->groupBy('perusahaan.kode_saham', 'perusahaan.nama_perusahaan');
        } else {
            $query->where('rasio_keuangan.tahun', $tahun)
                  ->select(
                      'rasio_keuangan.*',
                      'perusahaan.kode_saham',
                      'perusahaan.nama_perusahaan'
                  );
        }

        return response()->json(['data' => $query->get()]);
    }
}