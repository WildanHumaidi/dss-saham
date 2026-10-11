<?php

namespace App\Http\Controllers;

use App\Models\DraftLaporanKeuangan;
use App\Models\LaporanKeuangan;
use App\Models\Perusahaan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DraftLaporanController extends Controller
{
    // =========================================================================
    // POST /api/draft/ekstrak-gambar
    // Terima gambar neraca, simpan ke storage, update path di draft.
    // (Ekstraksi OCR bisa ditambahkan di sini bila ada integrasi Gemini/OCR.)
    // =========================================================================
    public function ekstrakGambar(Request $request)
    {
        $validated = $request->validate([
            'kode_saham' => 'required|string|max:10',
            'tahun' => 'required|integer|between:2000,2100',
            'tipe_gambar' => 'required|in:aset,liabilitas',   // aset | liabilitas
            'gambar' => 'required|image|max:5120',        // max 5 MB
        ]);

        $kode = strtoupper($validated['kode_saham']);
        $perusahaan = Perusahaan::where('kode_saham', $kode)->first();

        if (! $perusahaan) {
            return response()->json([
                'message' => "Emiten {$kode} tidak ditemukan. Tambahkan dulu di Data Master.",
            ], 422);
        }

        // Simpan gambar
        $path = $request->file('gambar')->store("draft/{$kode}/{$validated['tahun']}", 'public');

        // Upsert draft
        $draft = DraftLaporanKeuangan::firstOrCreate(
            ['perusahaan_id' => $perusahaan->id, 'tahun' => $validated['tahun']],
            ['status_draft' => 'incomplete']
        );

        if ($validated['tipe_gambar'] === 'aset') {
            $draft->image_aset_path = $path;
        } else {
            $draft->image_liabilitas_path = $path;
        }
        $draft->save();

        return response()->json([
            'message' => 'Gambar berhasil disimpan.',
            'path' => $path,
            'data' => $draft,
        ]);
    }

    // =========================================================================
    // POST /api/draft/upload-neraca
    // Simpan data neraca ke tabel draft (semua field nullable, bisa cicil).
    // =========================================================================
    public function uploadNeraca(Request $request)
    {
        $validated = $request->validate([
            'kode_saham' => 'required|string|max:10',
            'tahun' => 'required|integer|between:2000,2100',
            'skala_nominal' => 'nullable|string|max:20',
            'total_aset' => 'nullable|numeric',
            'total_liabilitas' => 'nullable|numeric',
            'total_ekuitas' => 'nullable|numeric',
            'jumlah_saham_beredar' => 'nullable|numeric',
            'pendapatan' => 'nullable|numeric',
            'laba_bersih' => 'nullable|numeric',
            'arus_kas_operasi' => 'nullable|numeric',
        ]);

        $kode = strtoupper($validated['kode_saham']);
        $perusahaan = Perusahaan::where('kode_saham', $kode)->first();

        if (! $perusahaan) {
            return response()->json([
                'message' => "Emiten {$kode} tidak ditemukan. Tambahkan dulu di Data Master.",
            ], 422);
        }

        $fillable = collect($validated)
            ->except(['kode_saham', 'tahun'])
            ->filter(fn ($v) => ! is_null($v))
            ->toArray();

        $draft = DraftLaporanKeuangan::updateOrCreate(
            ['perusahaan_id' => $perusahaan->id, 'tahun' => $validated['tahun']],
            $fillable
        );

        // Perbarui status_draft otomatis
        if ($draft->isReadyToPublish()) {
            $draft->status_draft = 'ready_for_review';
            $draft->save();
        }

        $action = $draft->wasRecentlyCreated ? 'dibuat' : 'diperbarui';

        return response()->json([
            'message' => "Draft {$kode} tahun {$validated['tahun']} berhasil {$action}.",
            'data' => $draft,
        ], $draft->wasRecentlyCreated ? 201 : 200);
    }

    // =========================================================================
    // POST /api/draft/publish
    // Pindahkan data dari draft → laporan_keuangan dengan status 'dipublikasi'.
    //
    // FIX: sebelumnya pakai firstOrFail() untuk perusahaan & draft, yang
    //      melempar 404 dengan pesan default Laravel (generik, bahasa
    //      Inggris) — tidak konsisten dengan method lain di controller ini
    //      yang mengembalikan pesan custom bahasa Indonesia. Sekarang
    //      dicek manual agar responsnya konsisten.
    // =========================================================================
    public function publishFinal(Request $request)
    {
        $validated = $request->validate([
            'kode_saham' => 'required|string|max:10',
            'tahun' => 'required|integer|between:2000,2100',
        ]);

        $kode = strtoupper($validated['kode_saham']);
        $perusahaan = Perusahaan::where('kode_saham', $kode)->first();

        if (! $perusahaan) {
            return response()->json([
                'message' => "Emiten {$kode} tidak ditemukan. Tambahkan dulu di Data Master.",
            ], 422);
        }

        $draft = DraftLaporanKeuangan::where('perusahaan_id', $perusahaan->id)
            ->where('tahun', $validated['tahun'])
            ->first();

        if (! $draft) {
            return response()->json([
                'message' => "Draft {$kode} tahun {$validated['tahun']} belum ada. Isi data draft terlebih dahulu.",
            ], 404);
        }

        if (! $draft->isReadyToPublish()) {
            return response()->json([
                'message' => 'Draft belum lengkap. Pastikan total_aset, total_liabilitas, dan total_ekuitas sudah diisi.',
            ], 422);
        }

        $existing = LaporanKeuangan::where('perusahaan_id', $perusahaan->id)
            ->where('tahun', $validated['tahun'])
            ->first();

        $laporan = LaporanKeuangan::updateOrCreate(
            ['perusahaan_id' => $perusahaan->id, 'tahun' => $validated['tahun']],
            [
                'total_aset' => $draft->total_aset,
                'total_liabilitas' => $draft->total_liabilitas,
                'total_ekuitas' => $draft->total_ekuitas,
                'jumlah_saham_beredar' => $draft->jumlah_saham_beredar ?? ($existing->jumlah_saham_beredar ?? 0),
                'pendapatan' => $draft->pendapatan ?? ($existing->pendapatan ?? 0),
                'laba_bersih' => $draft->laba_bersih ?? ($existing->laba_bersih ?? 0),
                'arus_kas_operasi' => $draft->arus_kas_operasi ?? ($existing->arus_kas_operasi ?? 0),
                'skala_nominal' => $draft->skala_nominal ?? ($existing->skala_nominal ?? 'Miliar'),
                'harga_saham' => $existing->harga_saham ?? 0,
                'dividen' => $existing->dividen ?? 0,
                'status_data' => 'dipublikasi',
            ]
        );

        // Tandai draft sebagai verified
        $draft->status_draft = 'verified';
        $draft->save();

        return response()->json([
            'message' => "Data {$kode} tahun {$validated['tahun']} berhasil dipublikasikan.",
            'data' => $laporan,
        ]);
    }
}
