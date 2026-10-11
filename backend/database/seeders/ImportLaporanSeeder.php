<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Perusahaan;
use App\Models\LaporanKeuangan;
use Illuminate\Support\Facades\DB;

class ImportLaporanSeeder extends Seeder
{
    public function run()
    {
        $file = database_path('seeders/data_saham_siap_pakai.csv');
        
        if (!file_exists($file)) {
            $this->command->error("❌ File CSV tidak ditemukan.");
            return;
        }

        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $this->command->info("🔍 Ditemukan " . count($lines) . " baris di file CSV.");

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $countInserted = 0;
        $countSkipped = 0;

        foreach ($lines as $index => $line) {
            if ($index === 0) continue; 

            // Coba pakai titik koma, kalau gagal pakai koma
            $data = str_getcsv($line, ';');
            if (count($data) < 9) {
                $data = str_getcsv($line, ',');
            }

            if (count($data) < 9) {
                $countSkipped++;
                continue;
            }

            // 🎯 INI DIA SOLUSINYA: POSISI KOLOM DISESUAIKAN DENGAN HASIL X-RAY!
            // Index 0 itu Tahun, Index 1 itu Kode Saham
            $tahun = (int) preg_replace('/[^0-9]/', '', $data[0]);
            $kode_saham = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $data[1]));

            if ($tahun < 2000 || empty($kode_saham)) {
                $countSkipped++;
                continue;
            }

            $perusahaan = Perusahaan::firstOrCreate(
                ['kode_saham' => $kode_saham],
                ['nama_perusahaan' => 'PT ' . $kode_saham . ' Tbk', 'sektor' => 'Belum Ditentukan'] 
            );

            // Pembersih angka aman
            $cleanNum = function($val) {
                $val = str_replace(',', '.', $val ?? '0');
                return (float) preg_replace('/[^0-9.-]/', '', $val);
            };

            LaporanKeuangan::updateOrCreate(
                [
                    'perusahaan_id' => $perusahaan->id,
                    'tahun'         => $tahun,
                ],
                [
                    'total_aset'           => $cleanNum($data[2]),
                    'total_liabilitas'     => $cleanNum($data[3]),
                    'total_ekuitas'        => $cleanNum($data[4]),
                    'jumlah_saham_beredar' => $cleanNum($data[5]),
                    'harga_saham'          => $cleanNum($data[6]),
                    'pendapatan'           => $cleanNum($data[7]),
                    'laba_bersih'          => $cleanNum($data[8]),
                    // Di CSV lu cuma ada 9 kolom, jadi Kas & Dividen kita set 0 default-nya
                    'arus_kas_operasi'     => $cleanNum($data[9] ?? 0),
                    'dividen'              => $cleanNum($data[10] ?? 0),
                    'skala_nominal'        => 'Miliar'
                ]
            );
            
            $countInserted++;
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        
        $this->command->info("✅ EKSEKUSI SELESAI!");
        $this->command->info("🟢 Sukses disuntikkan: $countInserted data.");
        if ($countSkipped > 0) {
            $this->command->warn("🔴 Baris rusak / kosong yang di-skip: $countSkipped data.");
        }
    }
}