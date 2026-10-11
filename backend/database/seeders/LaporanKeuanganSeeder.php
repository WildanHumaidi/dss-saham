<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Perusahaan;
use App\Models\LaporanKeuangan;

class LaporanKeuanganSeeder extends Seeder
{
    public function run(): void
    {
        $csvPath = database_path('seeders/data_saham_siap_pakai.csv');

        if (!file_exists($csvPath)) {
            $this->command->error('❌ File CSV tidak ditemukan di: ' . $csvPath);
            return;
        }

        $csvFile   = fopen($csvPath, 'r');
        $firstLine = true;
        $inserted  = 0;

        while (($data = fgetcsv($csvFile, 2000, ',')) !== false) {
            if ($firstLine) { $firstLine = false; continue; } // skip header

            $kode_saham = $data[0];
            $tahun      = (int) $data[1];

            $perusahaan = Perusahaan::firstOrCreate(
                ['kode_saham' => $kode_saham],
                ['nama_perusahaan' => 'Saham ' . $kode_saham]
            );

            LaporanKeuangan::updateOrCreate(
                ['perusahaan_id' => $perusahaan->id, 'tahun' => $tahun],
                [
                    'total_aset'           => (float) ($data[2] ?? 0),
                    // FIX: typo 'total_liabillitas' (dua l) → 'total_liabilitas'
                    'total_liabilitas'     => (float) ($data[3] ?? 0),
                    'total_ekuitas'        => (float) ($data[4] ?? 0),
                    'jumlah_saham_beredar' => (float) ($data[5] ?? 0),
                    'harga_saham'          => (float) ($data[6] ?? 0),
                    'pendapatan'           => (float) ($data[7] ?? 0),
                    'laba_bersih'          => (float) ($data[8] ?? 0),
                    'arus_kas_operasi'     => (float) ($data[9] ?? 0),
                    'dividen'              => (float) ($data[10] ?? 0),
                    'status_data'          => 'dipublikasi',
                ]
            );

            $inserted++;
        }

        fclose($csvFile);
        $this->command->info("✅ {$inserted} baris berhasil di-seed.");
    }
}