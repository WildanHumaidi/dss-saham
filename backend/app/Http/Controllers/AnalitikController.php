<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LaporanKeuangan;
use App\Models\Perusahaan;
use App\Models\Kriteria;
use App\Services\RatioService;
use App\Services\SmartSawService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

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
    // Delegated to RatioService
    // =========================================================================
    public function hitungRasio(Request $request, RatioService $ratioService)
    {
        $tahunFilter = $request->input('tahun');
        $processed = $ratioService->calculateRatios($tahunFilter ? (int) $tahunFilter : null);

        if ($processed === 0) {
            return response()->json([
                'message' => 'Tidak ada data berstatus "dipublikasi" untuk dihitung. '
                    . 'Publikasikan data lewat menu Draft atau Admin terlebih dahulu.',
            ], 404);
        }

        $label = $tahunFilter ? "tahun {$tahunFilter}" : "seluruh tahun";
        return response()->json(['message' => "Rasio {$label} berhasil dihitung dari data yang sudah dipublikasikan!"]);
    }

    // =========================================================================
    // 3. HITUNG PERINGKAT SAW (SEMUA TAHUN OTOMATIS)
    // Delegated to SmartSawService
    // =========================================================================
    public function hitungPeringkat(SmartSawService $smartSawService)
    {
        try {
            $smartSawService->calculateAllRankings();
            return response()->json(['message' => 'Peringkat seluruh periode historis selesai dihitung!']);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
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