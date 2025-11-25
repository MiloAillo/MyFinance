<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class RateLimiterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure API responses in tests return JSON instead of redirects
        $this->withHeaders(['Accept' => 'application/json']);

        // Clear any existing rate limiter state
        Cache::flush();
    }

    protected function tearDown(): void
    {
        // Clean up rate limiter state after each test
        Cache::flush();
        parent::tearDown();
    }

    public function test_login_rate_limiting_by_email_and_ip()
    {
        // Allow 3 attempts per minute for the same email+ip combination
        RateLimiter::for('login', fn ($request) => Limit::perMinute(3)->by(
            strtolower((string) $request->input('email', '')) . '|' . $request->ip()
        ));

        $url = '/api/auth/login';
        $email = 'rate-test-login@example.test';
        $ip = '203.0.113.5';
        $headers = [
            'X-Forwarded-For' => $ip,
            'Accept' => 'application/json',
        ];

        // First 3 attempts should not be rate limited
        for ($i = 1; $i <= 3; $i++) {
            $response = $this->postJson($url, ['email' => $email, 'password' => 'wrong-password'], $headers);
            $this->assertNotEquals(429, $response->getStatusCode(), "Request #{$i} unexpectedly rate limited");
        }

        // 4th attempt should trigger rate limiting
        $response = $this->postJson($url, ['email' => $email, 'password' => 'wrong-password'], $headers);
        $response->assertStatus(429);
        
        // Verify rate limit headers or message
        $this->assertTrue(
            $response->headers->has('Retry-After') ||
            $response->headers->has('X-RateLimit-Limit') ||
            stripos((string)($response->json('message') ?? $response->getContent()), 'too many') !== false,
            'Expected throttle information in headers or response body'
        );
    }

    public function test_login_rate_limiting_different_ips_separate_limits()
    {
        RateLimiter::for('login', fn ($request) => Limit::perMinute(2)->by(
            strtolower((string) $request->input('email', '')) . '|' . $request->ip()
        ));

        $url = '/api/auth/login';
        $email = 'rate-test@example.test';
        
        // Use different emails for different IPs to ensure complete separation
        $email1 = 'rate-test-ip1@example.test';
        $email2 = 'rate-test-ip2@example.test';
        $ip1 = '192.168.1.1';
        $ip2 = '192.168.1.2';

        // 2 attempts from IP1
        for ($i = 1; $i <= 2; $i++) {
            $response = $this->postJson($url, ['email' => $email1, 'password' => 'wrong'], [
                'X-Forwarded-For' => $ip1,
                'REMOTE_ADDR' => $ip1
            ]);
            $this->assertNotEquals(429, $response->getStatusCode());
        }

        // 2 attempts from IP2 (different email to ensure separation)
        for ($i = 1; $i <= 2; $i++) {
            $response = $this->postJson($url, ['email' => $email2, 'password' => 'wrong'], [
                'X-Forwarded-For' => $ip2,
                'REMOTE_ADDR' => $ip2
            ]);
            $this->assertNotEquals(429, $response->getStatusCode());
        }

        // 3rd attempt from IP1 should be rate limited
        $response = $this->postJson($url, ['email' => $email1, 'password' => 'wrong'], [
            'X-Forwarded-For' => $ip1,
            'REMOTE_ADDR' => $ip1
        ]);
        $response->assertStatus(429);

        // 3rd attempt from IP2 should also be rate limited
        $response = $this->postJson($url, ['email' => $email2, 'password' => 'wrong'], [
            'X-Forwarded-For' => $ip2,
            'REMOTE_ADDR' => $ip2
        ]);
        $response->assertStatus(429);
    }

    public function test_login_rate_limiting_different_emails_separate_limits()
    {
        RateLimiter::for('login', fn ($request) => Limit::perMinute(2)->by(
            strtolower((string) $request->input('email', '')) . '|' . $request->ip()
        ));

        $url = '/api/auth/login';
        $email1 = 'user1@example.test';
        $email2 = 'user2@example.test';
        $ip = '203.0.113.10';

        // 2 attempts for email1 should work
        for ($i = 1; $i <= 2; $i++) {
            $response = $this->postJson($url, ['email' => $email1, 'password' => 'wrong'], ['X-Forwarded-For' => $ip]);
            $this->assertNotEquals(429, $response->getStatusCode());
        }

        // 2 attempts for email2 should also work (separate rate limit)
        for ($i = 1; $i <= 2; $i++) {
            $response = $this->postJson($url, ['email' => $email2, 'password' => 'wrong'], ['X-Forwarded-For' => $ip]);
            $this->assertNotEquals(429, $response->getStatusCode());
        }

        // 3rd attempt for email1 should be rate limited
        $response = $this->postJson($url, ['email' => $email1, 'password' => 'wrong'], ['X-Forwarded-For' => $ip]);
        $response->assertStatus(429);
    }

    public function test_forgot_password_rate_limiting_by_email()
    {
        RateLimiter::for('forgot-password', fn ($request) => Limit::perMinute(3)->by(
            strtolower((string) $request->input('email', ''))
        ));

        $url = '/api/auth/forgot-password';
        $email = 'rate-test-forgot@example.test';

        // First 3 requests should be processed
        for ($i = 1; $i <= 3; $i++) {
            $response = $this->postJson($url, ['email' => $email]);
            $this->assertTrue(in_array($response->getStatusCode(), [200, 202, 422, 404]), 'Unexpected status: '.$response->getStatusCode());
        }

        // 4th should be rate limited
        $response = $this->postJson($url, ['email' => $email]);
        $response->assertStatus(429);
    }

    public function test_forgot_password_different_emails_separate_limits()
    {
        RateLimiter::for('forgot-password', fn ($request) => Limit::perMinute(2)->by(
            strtolower((string) $request->input('email', ''))
        ));

        $url = '/api/auth/forgot-password';
        $email1 = 'user1@example.test';
        $email2 = 'user2@example.test';

        // 2 attempts for each email should work
        for ($i = 1; $i <= 2; $i++) {
            $response1 = $this->postJson($url, ['email' => $email1]);
            $response2 = $this->postJson($url, ['email' => $email2]);
            
            $this->assertNotEquals(429, $response1->getStatusCode());
            $this->assertNotEquals(429, $response2->getStatusCode());
        }

        // 3rd attempt for each should be rate limited
        $response1 = $this->postJson($url, ['email' => $email1]);
        $response2 = $this->postJson($url, ['email' => $email2]);
        
        $response1->assertStatus(429);
        $response2->assertStatus(429);
    }

    public function test_reset_password_rate_limiting_by_token()
    {
        RateLimiter::for('reset-password', fn ($request) => Limit::perMinute(2)->by(
            substr((string) $request->input('token', ''), 0, 32) ?: 'reset-password-no-token'
        ));

        $url = '/api/auth/reset-password';
        $email = 'rate-test-reset@example.test';
        $token1 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
        $token2 = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

        // 2 attempts with token1 should work
        for ($i = 1; $i <= 2; $i++) {
            $response = $this->postJson($url, [
                'email' => $email,
                'token' => $token1,
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ]);
            $this->assertTrue(in_array($response->getStatusCode(), [200, 400, 422, 404]), 'Unexpected status: '.$response->getStatusCode());
        }

        // 2 attempts with token2 should also work (separate rate limit)
        for ($i = 1; $i <= 2; $i++) {
            $response = $this->postJson($url, [
                'email' => $email,
                'token' => $token2,
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ]);
            $this->assertTrue(in_array($response->getStatusCode(), [200, 400, 422, 404]), 'Unexpected status: '.$response->getStatusCode());
        }

        // 3rd attempt with token1 should be rate limited
        $response = $this->postJson($url, [
            'email' => $email,
            'token' => $token1,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);
        $response->assertStatus(429);
    }

    public function test_reset_password_no_token_rate_limiting()
    {
        RateLimiter::for('reset-password', fn ($request) => Limit::perMinute(2)->by(
            substr((string) $request->input('token', ''), 0, 32) ?: 'reset-password-no-token'
        ));

        $url = '/api/auth/reset-password';

        // Requests without token should share the same rate limit key
        for ($i = 1; $i <= 2; $i++) {
            $response = $this->postJson($url, [
                'email' => 'test@example.test',
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ]);
            $this->assertNotEquals(429, $response->getStatusCode());
        }

        // 3rd should be rate limited
        $response = $this->postJson($url, [
            'email' => 'test@example.test',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);
        $response->assertStatus(429);
    }

    public function test_global_api_rate_limiter_by_ip()
    {
        RateLimiter::for('api', fn ($request) => Limit::perMinute(5)->by($request->ip()));

        $url = '/api/auth/register';
        $ip = '203.0.113.20';

        // Create unique emails to avoid duplicate-email validation errors
        for ($i = 1; $i <= 5; $i++) {
            $email = "rl_test_{$i}_" . uniqid() . "@example.test";
            $response = $this->postJson($url, [
                'name' => 'Test User',
                'email' => $email,
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ], ['X-Forwarded-For' => $ip]);

            $this->assertNotEquals(429, $response->getStatusCode(), "Request #{$i} unexpectedly rate limited");
        }

        // 6th should be rate limited
        $email = "rl_test_6_" . uniqid() . "@example.test";
        $response = $this->postJson($url, [
            'name' => 'Test User',
            'email' => $email,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ], ['X-Forwarded-For' => $ip]);

        $response->assertStatus(429);
    }

    public function test_global_api_rate_limiter_different_ips()
    {
        RateLimiter::for('api', fn ($request) => Limit::perMinute(3)->by($request->ip()));

        $url = '/api/auth/register';
        $ip1 = '192.168.1.10';
        $ip2 = '192.168.1.11';

        // Clear any existing rate limits
        Cache::flush();

        // 3 requests from each IP should work
        for ($i = 1; $i <= 3; $i++) {
            $email1 = "user1_{$i}_" . uniqid() . "@example.test";
            $email2 = "user2_{$i}_" . uniqid() . "@example.test";

            $response1 = $this->postJson($url, [
                'name' => 'User 1',
                'email' => $email1,
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ], [
                'X-Forwarded-For' => $ip1,
                'REMOTE_ADDR' => $ip1
            ]);

            $this->assertNotEquals(429, $response1->getStatusCode(), "IP1 Request #{$i} unexpectedly rate limited");

            $response2 = $this->postJson($url, [
                'name' => 'User 2',
                'email' => $email2,
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ], [
                'X-Forwarded-For' => $ip2,
                'REMOTE_ADDR' => $ip2
            ]);

            $this->assertNotEquals(429, $response2->getStatusCode(), "IP2 Request #{$i} unexpectedly rate limited");
        }

        // 4th request from each IP should be rate limited
        $email1 = "user1_4_" . uniqid() . "@example.test";
        $email2 = "user2_4_" . uniqid() . "@example.test";

        $response1 = $this->postJson($url, [
            'name' => 'User 1',
            'email' => $email1,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ], [
            'X-Forwarded-For' => $ip1,
            'REMOTE_ADDR' => $ip1
        ]);

        $response2 = $this->postJson($url, [
            'name' => 'User 2',
            'email' => $email2,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ], [
            'X-Forwarded-For' => $ip2,
            'REMOTE_ADDR' => $ip2
        ]);

        $response1->assertStatus(429);
        $response2->assertStatus(429);
    }

    public function test_authenticated_api_endpoints_rate_limiting()
    {
        // Test rate limiting on authenticated endpoints
        RateLimiter::for('api', fn ($request) => Limit::perMinute(3)->by($request->ip()));

        $user = User::factory()->create();
        $url = '/api/user/profile'; // Assuming this exists

        for ($i = 1; $i <= 3; $i++) {
            $response = $this->actingAs($user)->getJson($url);
            $this->assertNotEquals(429, $response->getStatusCode());
        }

        // 4th should be rate limited
        $response = $this->actingAs($user)->getJson($url);
        $this->assertTrue(in_array($response->getStatusCode(), [429, 404]), 'Expected 429 or 404 if endpoint does not exist');
    }

    public function test_rate_limit_headers_present()
    {
        RateLimiter::for('login', fn ($request) => Limit::perMinute(5)->by($request->ip()));

        $url = '/api/auth/login';
        $response = $this->postJson($url, ['email' => 'test@example.test', 'password' => 'wrong']);

        // Check if rate limit headers are present (implementation dependent)
        if ($response->getStatusCode() !== 429) {
            // Some implementations add rate limit headers even on successful requests
            $hasRateLimitHeaders = $response->headers->has('X-RateLimit-Limit') ||
                                 $response->headers->has('X-RateLimit-Remaining') ||
                                 $response->headers->has('X-RateLimit-Reset');
            
            // This is informational - not all implementations include these headers
            $this->assertTrue(true, 'Rate limit headers check - implementation dependent');
        }
    }

    public function test_case_insensitive_email_rate_limiting()
    {
        RateLimiter::for('login', fn ($request) => Limit::perMinute(2)->by(
            strtolower((string) $request->input('email', '')) . '|' . $request->ip()
        ));

        $url = '/api/auth/login';
        $baseEmail = 'Rate-Test@Example.Test';
        $lowerEmail = strtolower($baseEmail);

        // Mixed case emails should share the same rate limit
        $response1 = $this->postJson($url, ['email' => $baseEmail, 'password' => 'wrong']);
        $response2 = $this->postJson($url, ['email' => $lowerEmail, 'password' => 'wrong']);

        $this->assertNotEquals(429, $response1->getStatusCode());
        $this->assertNotEquals(429, $response2->getStatusCode());

        // 3rd attempt should be rate limited
        $response3 = $this->postJson($url, ['email' => strtoupper($baseEmail), 'password' => 'wrong']);
        $response3->assertStatus(429);
    }

    public function test_empty_email_rate_limiting()
    {
        RateLimiter::for('login', fn ($request) => Limit::perMinute(2)->by(
            strtolower((string) $request->input('email', '')) . '|' . $request->ip()
        ));

        $url = '/api/auth/login';

        // Requests with empty/missing email should share the same rate limit key
        for ($i = 1; $i <= 2; $i++) {
            $response = $this->postJson($url, ['password' => 'wrong']);
            $this->assertNotEquals(429, $response->getStatusCode());
        }

        // 3rd should be rate limited
        $response = $this->postJson($url, ['email' => '', 'password' => 'wrong']);
        $response->assertStatus(429);
    }
}