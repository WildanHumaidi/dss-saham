<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LoginRateLimiterTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_endpoint_throttles_after_five_attempts(): void
    {
        $user = User::factory()->create([
            'email' => 'ratelimit@example.com',
            'password' => bcrypt('correctpassword'),
        ]);

        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/login', [
                'email' => 'ratelimit@example.com',
                'password' => 'wrongpassword',
            ]);
            $response->assertStatus(401);
        }

        // 6th attempt must be 429 Too Many Requests
        $response = $this->postJson('/api/login', [
            'email' => 'ratelimit@example.com',
            'password' => 'wrongpassword',
        ]);
        $response->assertStatus(429);
    }
}
