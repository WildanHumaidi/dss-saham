<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use App\Models\User;
use App\Models\LaporanKeuangan;

class AdminController extends Controller
{
    // =========================================================================
    // MANAJEMEN USER
    // =========================================================================

    /**
     * GET /api/admin/users
     */
    public function getUsers(Request $request)
    {
        $query = User::orderBy('id');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'data' => $query->get(['id', 'name', 'email', 'role', 'created_at', 'updated_at']),
        ]);
    }

    /**
     * POST /api/admin/users
     */
    public function storeUser(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => ['required', Password::min(6)],
            'role'     => 'required|in:admin,user',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
        ]);

        return response()->json([
            'message' => "User {$user->name} berhasil dibuat.",
            'data'    => $user->only(['id', 'name', 'email', 'role', 'created_at']),
        ], 201);
    }

    /**
     * PUT /api/admin/users/{id}
     */
    public function updateUser(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => "sometimes|required|email|unique:users,email,{$id}",
            'password' => ['sometimes', 'nullable', Password::min(6)],
            'role'     => 'sometimes|required|in:admin,user',
        ]);

        if (isset($validated['name']))  $user->name  = $validated['name'];
        if (isset($validated['email'])) $user->email = $validated['email'];
        if (isset($validated['role']))  $user->role  = $validated['role'];
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json([
            'message' => "User {$user->name} berhasil diperbarui.",
            'data'    => $user->only(['id', 'name', 'email', 'role', 'updated_at']),
        ]);
    }

    /**
     * DELETE /api/admin/users/{id}
     * Tidak boleh hapus diri sendiri.
     */
    public function destroyUser(Request $request, int $id)
    {
        if ($request->user()->id === $id) {
            return response()->json(['message' => 'Tidak bisa menghapus akun sendiri.'], 422);
        }

        $user = User::findOrFail($id);
        $name = $user->name;
        $user->delete();

        return response()->json(['message' => "User \"{$name}\" berhasil dihapus."]);
    }

    // =========================================================================
    // MANAJEMEN LAPORAN KEUANGAN
    // =========================================================================

    /**
     * GET /api/admin/laporan
     * Filter: ?tahun=2024&kode=BBCA&status=draft
     */
    public function getLaporan(Request $request)
    {
        $query = LaporanKeuangan::query()
            ->join('perusahaan', 'laporan_keuangan.perusahaan_id', '=', 'perusahaan.id')
            ->select(
                'laporan_keuangan.*',
                'perusahaan.kode_saham',
                'perusahaan.nama_perusahaan',
                'perusahaan.sektor'
            )
            ->orderByDesc('laporan_keuangan.tahun')
            ->orderBy('perusahaan.kode_saham');

        if ($tahun = $request->query('tahun')) {
            $query->where('laporan_keuangan.tahun', $tahun);
        }

        if ($kode = $request->query('kode')) {
            $query->where('perusahaan.kode_saham', strtoupper($kode));
        }

        if ($status = $request->query('status')) {
            $query->where('laporan_keuangan.status_data', $status);
        }

        return response()->json(['data' => $query->get()]);
    }

    /**
     * PUT /api/admin/laporan/{id}
     * Update semua field laporan + status_data.
     */
    public function updateLaporan(Request $request, int $id)
    {
        $laporan = LaporanKeuangan::findOrFail($id);

        $validated = $request->validate([
            'tahun'                => 'sometimes|required|integer|between:2000,2100',
            'total_aset'           => 'sometimes|required|numeric',
            'total_liabilitas'     => 'sometimes|required|numeric',
            'total_ekuitas'        => 'sometimes|required|numeric',
            'pendapatan'           => 'sometimes|required|numeric',
            'laba_bersih'          => 'sometimes|required|numeric',
            'arus_kas_operasi'     => 'sometimes|required|numeric',
            'harga_saham'          => 'sometimes|nullable|numeric',
            'jumlah_saham_beredar' => 'sometimes|nullable|numeric',
            'dividen'              => 'sometimes|nullable|numeric',
            'status_data'          => 'sometimes|required|in:draft,direview,dipublikasi',
        ]);

        $laporan->update($validated);

        return response()->json([
            'message' => 'Laporan berhasil diperbarui.',
            'data'    => $laporan,
        ]);
    }

    /**
     * DELETE /api/admin/laporan/{id}
     */
    public function destroyLaporan(int $id)
    {
        $laporan = LaporanKeuangan::findOrFail($id);
        $laporan->delete();

        return response()->json(['message' => 'Laporan berhasil dihapus.']);
    }
}