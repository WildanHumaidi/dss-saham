<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Kriteria;
use App\Models\Perusahaan;
use App\Models\RasioKeuangan;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AnalitikZeroWeightTest extends TestCase
{
    use RefreshDatabase;

    public function test_hitung_peringkat_returns_422_when_total_kriteria_weight_is_zero(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $perusahaan = Perusahaan::create(['kode_saham' => 'TEST', 'nama_perusahaan' => 'PT Test']);

        RasioKeuangan::create([
            'perusahaan_id' => $perusahaan->id,
            'tahun' => 2024,
            'roa' => 10.5,
            'roe' => 15.2,
            'npm' => 12.0,
            'rasio_arus_kas_operasi' => 0.05,
            'rasio_utang' => 0.8,
        ]);

        Kriteria::create([
            'kode' => 'C1',
            'nama_kriteria' => 'ROA',
            'atribut' => 'benefit',
            'bobot_awal' => 0,
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/analitik/hitung-peringkat');
        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'Total bobot kriteria harus lebih besar dari 0!']);
    }
}
