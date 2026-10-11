<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityAccessControlTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_access_mutation_endpoints(): void
    {
        $regularUser = User::factory()->create(['role' => 'user']);

        // Non-admin tries to create perusahaan -> must be forbidden (403)
        $response = $this->actingAs($regularUser, 'sanctum')->postJson('/api/perusahaan', [
            'kode_saham' => 'TEST',
            'nama_perusahaan' => 'Test Company',
        ]);
        $response->assertStatus(403);

        // Non-admin tries to upload laporan neraca -> must be forbidden (403)
        $response = $this->actingAs($regularUser, 'sanctum')->postJson('/api/laporan/upload-neraca', [
            'kode_saham' => 'TEST',
            'tahun' => 2024,
            'total_aset' => 100,
            'total_liabilitas' => 50,
            'total_ekuitas' => 50,
            'pendapatan' => 80,
            'laba_bersih' => 20,
            'arus_kas_operasi' => 15,
        ]);
        $response->assertStatus(403);

        // Non-admin tries to publish draft -> must be forbidden (403)
        $response = $this->actingAs($regularUser, 'sanctum')->postJson('/api/draft/publish', [
            'kode_saham' => 'TEST',
            'tahun' => 2024,
        ]);
        $response->assertStatus(403);
    }

    public function test_admin_can_access_mutation_endpoints(): void
    {
        $adminUser = User::factory()->create(['role' => 'admin']);

        // Admin can create perusahaan -> 201 Created
        $response = $this->actingAs($adminUser, 'sanctum')->postJson('/api/perusahaan', [
            'kode_saham' => 'TEST',
            'nama_perusahaan' => 'Test Company',
        ]);
        $response->assertStatus(201);
    }
}
