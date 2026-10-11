<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Perusahaan;
use App\Models\LaporanKeuangan;
use App\Models\Kriteria;
use App\Models\RasioKeuangan;
use App\Models\Peringkat;
use App\Services\RatioService;
use App\Services\SmartSawService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ServicesTest extends TestCase
{
    use RefreshDatabase;

    public function test_ratio_service_calculates_and_stores_ratios(): void
    {
        $p = Perusahaan::create(['kode_saham' => 'SRVC', 'nama_perusahaan' => 'PT Service Test']);

        LaporanKeuangan::create([
            'perusahaan_id' => $p->id,
            'tahun' => 2024,
            'total_aset' => 1000,
            'total_liabilitas' => 400,
            'total_ekuitas' => 600,
            'jumlah_saham_beredar' => 1000,
            'harga_saham' => 2000,
            'pendapatan' => 800,
            'laba_bersih' => 200,
            'arus_kas_operasi' => 100,
            'status_data' => 'dipublikasi',
        ]);

        $service = new RatioService();
        $processed = $service->calculateRatios(2024);

        $this->assertEquals(1, $processed);

        $rasio = RasioKeuangan::where('perusahaan_id', $p->id)->where('tahun', 2024)->first();
        $this->assertNotNull($rasio);
        $this->assertEquals(20.0, (float) $rasio->roa);
        $this->assertEquals(33.3333, round((float) $rasio->roe, 4));
        $this->assertEquals(25.0, (float) $rasio->npm);
        $this->assertEquals(0.1, (float) $rasio->rasio_arus_kas_operasi);
        $this->assertEquals(0.6667, round((float) $rasio->rasio_utang, 4));
    }

    public function test_smart_saw_service_calculates_rankings_correctly(): void
    {
        $p = Perusahaan::create(['kode_saham' => 'SRVC2', 'nama_perusahaan' => 'PT Service Test 2']);

        RasioKeuangan::create([
            'perusahaan_id' => $p->id,
            'tahun' => 2024,
            'roa' => 20.0,
            'roe' => 30.0,
            'npm' => 25.0,
            'rasio_arus_kas_operasi' => 0.1,
            'rasio_utang' => 0.5,
        ]);

        Kriteria::create(['kode' => 'C1', 'nama_kriteria' => 'ROA', 'atribut' => 'benefit', 'bobot_awal' => 25]);
        Kriteria::create(['kode' => 'C2', 'nama_kriteria' => 'ROE', 'atribut' => 'benefit', 'bobot_awal' => 25]);
        Kriteria::create(['kode' => 'C3', 'nama_kriteria' => 'NPM', 'atribut' => 'benefit', 'bobot_awal' => 20]);
        Kriteria::create(['kode' => 'C4', 'nama_kriteria' => 'Kas', 'atribut' => 'benefit', 'bobot_awal' => 15]);
        Kriteria::create(['kode' => 'C5', 'nama_kriteria' => 'DER', 'atribut' => 'cost', 'bobot_awal' => 15]);

        $service = new SmartSawService();
        $total = $service->calculateAllRankings();

        $this->assertEquals(1, $total);

        $rank = Peringkat::where('perusahaan_id', $p->id)->first();
        $this->assertNotNull($rank);
        $this->assertEquals(1, $rank->peringkat_ke);
        $this->assertGreaterThan(0, (float) $rank->nilai_preferensi);
    }
}
