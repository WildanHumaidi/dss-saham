<?php

namespace App\Http\Controllers;

use App\Models\LaporanKeuangan;
use App\Models\Perusahaan;
use Illuminate\Http\Request;

class LaporanController extends Controller
{
    /**
     * POST /api/laporan/upload-neraca
     *
     * Dipakai oleh InputData.jsx — simpan satu baris data per submit.
     * Jika (perusahaan_id, tahun) sudah ada, lakukan update.
     *
     * FIX: sebelumnya status_data SELALU di-set 'draft', bahkan saat ini
     * adalah UPDATE ke baris yang sudah 'dipublikasi'/'direview' — artinya
     * status publikasi bisa diam-diam turun setiap kali form ini disubmit
     * ulang. Sekarang status_data hanya di-set 'draft' saat baris BARU
     * dibuat; saat update ke baris yang sudah ada, status_data lama
     * dipertahankan apa adanya.
     */
    public function uploadNeraca(Request $request)
    {
        $validated = $request->validate([
            'kode_saham' => 'required|string|max:10',
            'tahun' => 'required|integer|between:2000,2100',
            'total_aset' => 'required|numeric',
            'total_liabilitas' => 'required|numeric',
            'total_ekuitas' => 'required|numeric',
            'pendapatan' => 'required|numeric',
            'laba_bersih' => 'required|numeric',
            'arus_kas_operasi' => 'required|numeric',
            'harga_saham' => 'nullable|numeric',
            'jumlah_saham_beredar' => 'nullable|numeric',
            'dividen' => 'nullable|numeric',
        ]);

        $kode = strtoupper($validated['kode_saham']);
        $perusahaan = Perusahaan::where('kode_saham', $kode)->first();

        if (! $perusahaan) {
            return response()->json([
                'message' => "Emiten {$kode} tidak ditemukan. Tambahkan dulu di Data Master.",
            ], 422);
        }

        $laporan = LaporanKeuangan::firstOrNew([
            'perusahaan_id' => $perusahaan->id,
            'tahun' => $validated['tahun'],
        ]);

        $isNew = ! $laporan->exists;

        $laporan->fill([
            'total_aset' => $validated['total_aset'],
            'total_liabilitas' => $validated['total_liabilitas'],
            'total_ekuitas' => $validated['total_ekuitas'],
            'pendapatan' => $validated['pendapatan'],
            'laba_bersih' => $validated['laba_bersih'],
            'arus_kas_operasi' => $validated['arus_kas_operasi'],
            'harga_saham' => $validated['harga_saham'] ?? $laporan->harga_saham ?? 0,
            'jumlah_saham_beredar' => $validated['jumlah_saham_beredar'] ?? $laporan->jumlah_saham_beredar ?? 0,
            'dividen' => $validated['dividen'] ?? $laporan->dividen ?? 0,
        ]);

        // Hanya baris BARU yang otomatis berstatus 'draft'.
        // Baris lama (mis. sudah 'dipublikasi') tidak diturunkan status-nya
        // oleh endpoint ini — untuk itu gunakan alur draft/publish atau
        // panel admin (PUT /admin/laporan/{id}).
        if ($isNew) {
            $laporan->status_data = 'draft';
        }

        $laporan->save();

        $action = $isNew ? 'ditambahkan' : 'diperbarui';

        return response()->json([
            'message' => "Data {$kode} tahun {$validated['tahun']} berhasil {$action}.",
            'data' => $laporan,
        ], $isNew ? 201 : 200);
    }
}
