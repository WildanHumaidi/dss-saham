<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Perusahaan;
use App\Models\LaporanKeuangan;
use App\Models\DraftLaporanKeuangan;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DraftPublishMarketDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_publish_draft_preserves_existing_market_data(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $perusahaan = Perusahaan::create(['kode_saham' => 'BBCA', 'nama_perusahaan' => 'Bank Central Asia']);

        // Existing report with price and dividend set by admin
        LaporanKeuangan::create([
            'perusahaan_id' => $perusahaan->id,
            'tahun' => 2024,
            'total_aset' => 1000,
            'total_liabilitas' => 400,
            'total_ekuitas' => 600,
            'jumlah_saham_beredar' => 1000000,
            'harga_saham' => 9500,
            'pendapatan' => 500,
            'laba_bersih' => 200,
            'arus_kas_operasi' => 150,
            'dividen' => 300,
            'status_data' => 'direview',
        ]);

        // Draft with updated balance sheet numbers
        DraftLaporanKeuangan::create([
            'perusahaan_id' => $perusahaan->id,
            'tahun' => 2024,
            'total_aset' => 1100,
            'total_liabilitas' => 450,
            'total_ekuitas' => 650,
            'status_draft' => 'ready_for_review',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/draft/publish', [
            'kode_saham' => 'BBCA',
            'tahun' => 2024,
        ]);

        $response->assertStatus(200);

        $updated = LaporanKeuangan::where('perusahaan_id', $perusahaan->id)->where('tahun', 2024)->first();
        $this->assertEquals(1100, $updated->total_aset);
        $this->assertEquals(450, $updated->total_liabilitas);
        $this->assertEquals(650, $updated->total_ekuitas);
        // Preserved market data
        $this->assertEquals(9500, (float) $updated->harga_saham);
        $this->assertEquals(300, (float) $updated->dividen);
        $this->assertEquals('dipublikasi', $updated->status_data);
    }
}
