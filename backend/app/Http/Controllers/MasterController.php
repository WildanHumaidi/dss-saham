<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Perusahaan;
use App\Models\Kriteria;

class MasterController extends Controller
{
    // =========================================================================
    // PERUSAHAAN
    // =========================================================================

    public function getPerusahaan()
    {
        return response()->json(['data' => Perusahaan::orderBy('kode_saham')->get()]);
    }

    public function storePerusahaan(Request $request)
    {
        $validated = $request->validate([
            'kode_saham'      => 'required|string|max:10|unique:perusahaan,kode_saham',
            'nama_perusahaan' => 'required|string|max:255',
            'sektor'          => 'nullable|string|max:100',
        ]);

        $validated['kode_saham'] = strtoupper($validated['kode_saham']);

        $p = Perusahaan::create($validated);

        return response()->json([
            'message' => "{$p->kode_saham} berhasil ditambahkan.",
            'data'    => $p,
        ], 201);
    }

    // BARU: Update nama / sektor (kode_saham tidak boleh diubah)
    public function updatePerusahaan(Request $request, int $id)
    {
        $perusahaan = Perusahaan::findOrFail($id);

        $validated = $request->validate([
            'nama_perusahaan' => 'sometimes|required|string|max:255',
            'sektor'          => 'nullable|string|max:100',
        ]);

        $perusahaan->update($validated);

        return response()->json([
            'message' => "{$perusahaan->kode_saham} berhasil diperbarui.",
            'data'    => $perusahaan,
        ]);
    }

    // BARU: Hapus perusahaan — CASCADE ke laporan, rasio, peringkat sudah ada di DB
    public function destroyPerusahaan(int $id)
    {
        $perusahaan = Perusahaan::findOrFail($id);
        $kode       = $perusahaan->kode_saham;

        $perusahaan->delete();

        return response()->json([
            'message' => "Emiten {$kode} dan seluruh data terkait berhasil dihapus.",
        ]);
    }

    // =========================================================================
    // KRITERIA
    // =========================================================================

    public function getKriteria()
    {
        return response()->json(['data' => Kriteria::orderBy('id')->get()]);
    }

    // DIPERBARUI: bisa update kode, nama_kriteria, atribut, dan bobot_awal sekaligus
    public function updateKriteria(Request $request, int $id)
    {
        $kriteria = Kriteria::findOrFail($id);

        $validated = $request->validate([
            'kode'           => "sometimes|required|string|max:5|unique:kriteria,kode,{$id}",
            'nama_kriteria'  => 'sometimes|required|string|max:255',
            'atribut'        => 'sometimes|required|in:benefit,cost',
            'bobot_awal'     => 'sometimes|required|numeric|min:0.01',
        ]);

        $kriteria->update($validated);

        return response()->json([
            'message' => 'Kriteria berhasil diperbarui.',
            'data'    => $kriteria,
        ]);
    }

    public function normalizeKriteria()
    {
        $kriteria = Kriteria::all();
        $total    = $kriteria->sum('bobot_awal');

        if ($total <= 0) {
            return response()->json(['message' => 'Total bobot harus lebih dari 0.'], 422);
        }

        foreach ($kriteria as $k) {
            $k->bobot_normalisasi = $k->bobot_awal / $total;
            $k->save();
        }

        return response()->json(['message' => 'Normalisasi SMART berhasil.']);
    }
}