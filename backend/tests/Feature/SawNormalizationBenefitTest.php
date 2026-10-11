<?php

namespace Tests\Feature;

use App\Models\Kriteria;
use App\Models\Peringkat;
use App\Models\Perusahaan;
use App\Models\RasioKeuangan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SawNormalizationBenefitTest extends TestCase
{
    use RefreshDatabase;

    public function test_negative_benefit_ratios_do_not_produce_negative_preference_scores(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $p1 = Perusahaan::create(['kode_saham' => 'PROFIT', 'nama_perusahaan' => 'PT Profit']);
        $p2 = Perusahaan::create(['kode_saham' => 'LOSS', 'nama_perusahaan' => 'PT Rugi']);

        // Emiten 1 untung
        RasioKeuangan::create([
            'perusahaan_id' => $p1->id,
            'tahun' => 2024,
            'roa' => 15.0,
            'roe' => 20.0,
            'npm' => 10.0,
            'rasio_arus_kas_operasi' => 0.1,
            'rasio_utang' => 0.5,
        ]);

        // Emiten 2 rugi (ROA, ROE, NPM negatif)
        RasioKeuangan::create([
            'perusahaan_id' => $p2->id,
            'tahun' => 2024,
            'roa' => -15.0,
            'roe' => -25.0,
            'npm' => -30.0,
            'rasio_arus_kas_operasi' => 0.0,
            'rasio_utang' => 2.0,
        ]);

        Kriteria::create(['kode' => 'C1', 'nama_kriteria' => 'ROA', 'atribut' => 'benefit', 'bobot_awal' => 25]);
        Kriteria::create(['kode' => 'C2', 'nama_kriteria' => 'ROE', 'atribut' => 'benefit', 'bobot_awal' => 25]);
        Kriteria::create(['kode' => 'C3', 'nama_kriteria' => 'NPM', 'atribut' => 'benefit', 'bobot_awal' => 20]);
        Kriteria::create(['kode' => 'C4', 'nama_kriteria' => 'Kas', 'atribut' => 'benefit', 'bobot_awal' => 15]);
        Kriteria::create(['kode' => 'C5', 'nama_kriteria' => 'DER', 'atribut' => 'cost', 'bobot_awal' => 15]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/analitik/hitung-peringkat');
        $response->assertStatus(200);

        $lossRank = Peringkat::where('perusahaan_id', $p2->id)->first();
        $this->assertNotNull($lossRank);
        // Preference score must be >= 0, never negative
        $this->assertGreaterThanOrEqual(0, (float) $lossRank->nilai_preferensi);
        // Profit company must rank 1
        $profitRank = Peringkat::where('perusahaan_id', $p1->id)->first();
        $this->assertEquals(1, $profitRank->peringkat_ke);
        $this->assertEquals(2, $lossRank->peringkat_ke);
    }
}
