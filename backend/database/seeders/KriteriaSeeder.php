<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Kriteria;

class KriteriaSeeder extends Seeder
{
    public function run()
    {
        $kriteria = [
            ['kode' => 'C1', 'nama_kriteria' => 'Return on Assets (ROA)', 'atribut' => 'benefit', 'bobot_awal' => 25],
            ['kode' => 'C2', 'nama_kriteria' => 'Return on Equity (ROE)', 'atribut' => 'benefit', 'bobot_awal' => 25],
            ['kode' => 'C3', 'nama_kriteria' => 'Net Profit Margin (NPM)', 'atribut' => 'benefit', 'bobot_awal' => 20],
            ['kode' => 'C4', 'nama_kriteria' => 'Rasio Arus Kas Operasi', 'atribut' => 'benefit', 'bobot_awal' => 15],
            ['kode' => 'C5', 'nama_kriteria' => 'Debt to Equity Ratio (DER)', 'atribut' => 'cost', 'bobot_awal' => 15],
        ];

        foreach ($kriteria as $k) {
            // Pake updateOrCreate biar aman kalau di-run 2 kali
            Kriteria::updateOrCreate(['kode' => $k['kode']], $k);
        }
        
        $this->command->info('✅ Data Kriteria SAW berhasil diisi!');
    }
}