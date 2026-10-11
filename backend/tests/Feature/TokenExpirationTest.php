<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TokenExpirationTest extends TestCase
{
    use RefreshDatabase;

    public function test_token_is_valid_within_expiration_time(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)->getJson('/api/user');
        $response->assertStatus(200);
    }

    public function test_token_is_invalid_after_expiration_time(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $token = $user->createToken('auth_token')->plainTextToken;

        // Fast forward 25 hours (past 24h / 1440 min expiration)
        Carbon::setTestNow(Carbon::now()->addHours(25));

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)->getJson('/api/user');
        $response->assertStatus(401);

        Carbon::setTestNow();
    }
}
