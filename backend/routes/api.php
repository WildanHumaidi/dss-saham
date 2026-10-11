<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MasterController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\AnalitikController;
use App\Http\Controllers\DraftLaporanController;
use App\Http\Controllers\AdminController;

// =============================================================================
// PUBLIC — tidak perlu login
// =============================================================================

Route::post('/login',  [AuthController::class, 'login']);

// Peringkat & screener boleh dilihat publik
Route::get('/analitik/screener',      [AnalitikController::class, 'getScreener']);
Route::get('/analitik/hasil/{tahun}', [AnalitikController::class, 'getHasilPeringkat']);
Route::get('/analitik/tren',          [AnalitikController::class, 'getTrenPeringkat']);

// FIX: Gunakan closure agar $tahun = 'all' benar-benar sampai ke controller.
// ->defaults('tahun','all') hanya bekerja untuk parameter {tahun} di URI,
// bukan untuk route static seperti /rasio/all.
Route::get('/analitik/rasio/all', function () {
    return app(AnalitikController::class)->getRasioData('all');
});
Route::get('/analitik/rasio/{tahun}', [AnalitikController::class, 'getRasioData']);

// Perusahaan & kriteria bisa dilihat tanpa login (untuk halaman publik)
Route::get('/perusahaan', [MasterController::class, 'getPerusahaan']);
Route::get('/kriteria',   [MasterController::class, 'getKriteria']);

// =============================================================================
// AUTHENTICATED — perlu login (Sanctum)
// =============================================================================

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user',    [AuthController::class, 'me']);

    // ── Perusahaan (tambah — semua yang login) ──────────────────────────
    Route::post('/perusahaan', [MasterController::class, 'storePerusahaan']);

    // ── Laporan keuangan (InputData.jsx) ────────────────────────────────
    Route::post('/laporan/upload-neraca', [LaporanController::class, 'uploadNeraca']);

    // ── Draft & Upload Gambar (DraftLaporanController) ──────────────────
    Route::post('/draft/ekstrak-gambar', [DraftLaporanController::class, 'ekstrakGambar']);
    Route::post('/draft/upload-neraca',  [DraftLaporanController::class, 'uploadNeraca']);
    Route::post('/draft/publish',        [DraftLaporanController::class, 'publishFinal']);

    // =========================================================================
    // ADMIN ONLY — role = 'admin'
    // =========================================================================

    Route::middleware('is_admin')->group(function () {

        // Perusahaan: update & hapus
        Route::put('/perusahaan/{id}',    [MasterController::class, 'updatePerusahaan']);
        Route::delete('/perusahaan/{id}', [MasterController::class, 'destroyPerusahaan']);

        // ── Kriteria ────────────────────────────────────────────────────
        // PINDAH ke admin-only (sebelumnya bisa diakses semua user login).
        // Bobot kriteria menentukan hasil ranking SAW untuk SELURUH sistem
        // yang dilihat publik, jadi hanya admin yang boleh mengubahnya.
        Route::put('/kriteria/{id}',       [MasterController::class, 'updateKriteria']);
        Route::post('/kriteria/normalize', [MasterController::class, 'normalizeKriteria']);

        // ── Analitik batch ──────────────────────────────────────────────
        // PINDAH ke admin-only (sebelumnya bisa diakses semua user login).
        // Endpoint ini menghitung ulang rasio & peringkat untuk SELURUH
        // data, dampaknya global ke tampilan publik.
        Route::post('/analitik/hitung-rasio',     [AnalitikController::class, 'hitungRasio']);
        Route::post('/analitik/hitung-peringkat', [AnalitikController::class, 'hitungPeringkat']);

        // Admin Panel
        Route::prefix('admin')->group(function () {

            // User management
            Route::get('/users',         [AdminController::class, 'getUsers']);
            Route::post('/users',        [AdminController::class, 'storeUser']);
            Route::put('/users/{id}',    [AdminController::class, 'updateUser']);
            Route::delete('/users/{id}', [AdminController::class, 'destroyUser']);

            // Laporan keuangan management
            Route::get('/laporan',         [AdminController::class, 'getLaporan']);
            Route::put('/laporan/{id}',    [AdminController::class, 'updateLaporan']);
            Route::delete('/laporan/{id}', [AdminController::class, 'destroyLaporan']);
        });
    });
});