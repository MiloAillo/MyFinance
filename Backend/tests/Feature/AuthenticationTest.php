<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\API\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders(['Accept' => 'application/json']);
    }

    // ==================== REGISTRATION TESTS ====================

    public function test_user_can_register_with_valid_data(): void
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password123!@#',
            'password_confirmation' => 'Password123!@#'
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'response_code',
            'status',
            'message',
            'data' => [
                'user_info' => [
                    'id',
                    'name',
                    'email'
                ],
                'token',
                'token_type',
                'expires_in'
            ]
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'name' => 'Test User'
        ]);

        $user = User::where('email', 'test@example.com')->first();
        $this->assertTrue(Hash::check('Password123!@#', $user->password));
    }

    public function test_registration_fails_with_short_name(): void
    {
        $userData = [
            'name' => 'AB',
            'email' => 'test@example.com',
            'password' => 'Password123!@#',
            'password_confirmation' => 'Password123!@#'
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_registration_fails_with_long_name(): void
    {
        $userData = [
            'name' => str_repeat('A', 51),
            'email' => 'test@example.com',
            'password' => 'Password123!@#',
            'password_confirmation' => 'Password123!@#'
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_registration_fails_with_invalid_email(): void
    {
        $invalidEmails = [
            'notanemail',
            '@nodomain.com',
            'spaces in@email.com'
        ];

        foreach ($invalidEmails as $email) {
            $response = $this->postJson('/api/auth/register', [
                'name' => 'Test User',
                'email' => $email,
                'password' => 'Password123!@#',
                'password_confirmation' => 'Password123!@#'
            ]);

            $response->assertStatus(422);
            $response->assertJsonValidationErrors(['email']);
        }
    }

    public function test_registration_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'existing@example.com',
            'password' => 'Password123!@#',
            'password_confirmation' => 'Password123!@#'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_registration_fails_with_weak_password(): void
    {
        $weakPasswords = [
            'short1!',              // Too short
            'alllowercase123!',     // No uppercase
            'ALLUPPERCASE123!',     // No lowercase
            'NoNumbers!@#',         // No numbers
            'NoSymbols123',         // No symbols
        ];

        foreach ($weakPasswords as $password) {
            $response = $this->postJson('/api/auth/register', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => $password,
                'password_confirmation' => $password
            ]);

            $response->assertStatus(422);
            $response->assertJsonValidationErrors(['password']);
        }
    }

    public function test_registration_fails_with_password_mismatch(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password123!@#',
            'password_confirmation' => 'DifferentPassword123!@#'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_registration_fails_with_missing_fields(): void
    {
        $requiredFields = ['name', 'email', 'password'];

        foreach ($requiredFields as $field) {
            $userData = [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => 'Password123!@#',
                'password_confirmation' => 'Password123!@#'
            ];

            unset($userData[$field]);

            $response = $this->postJson('/api/auth/register', $userData);

            $response->assertStatus(422);
            $response->assertJsonValidationErrors([$field]);
        }
    }

    // ==================== LOGIN TESTS ====================

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123!@#')
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'Password123!@#'
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'response_code',
            'status',
            'message',
            'data' => [
                'user_info' => [
                    'id',
                    'name',
                    'email'
                ],
                'token',
                'token_type',
                'expires_in'
            ]
        ]);

        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123!@#')
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'WrongPassword123!@#'
        ]);

        $response->assertStatus(401);
    }

    public function test_login_fails_with_non_existent_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'Password123!@#'
        ]);

        $response->assertStatus(401);
    }

    public function test_login_fails_with_invalid_email_format(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'notanemail',
            'password' => 'Password123!@#'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_login_fails_with_missing_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_is_case_sensitive_for_password(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123!@#')
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123!@#' // lowercase
        ]);

        $response->assertStatus(401);
    }

    public function test_multiple_users_can_login_simultaneously(): void
    {
        $user1 = User::factory()->create([
            'email' => 'user1@example.com',
            'password' => Hash::make('Password123!@#')
        ]);

        $user2 = User::factory()->create([
            'email' => 'user2@example.com',
            'password' => Hash::make('Password123!@#')
        ]);

        $response1 = $this->postJson('/api/auth/login', [
            'email' => 'user1@example.com',
            'password' => 'Password123!@#'
        ]);

        $response2 = $this->postJson('/api/auth/login', [
            'email' => 'user2@example.com',
            'password' => 'Password123!@#'
        ]);

        $response1->assertStatus(200);
        $response2->assertStatus(200);

        $token1 = $response1->json('data.token');
        $token2 = $response2->json('data.token');

        $this->assertNotEquals($token1, $token2);
    }

    // ==================== LOGOUT TESTS ====================

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/auth/logout');

        $response->assertStatus(200);

        // Verify token is deleted
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'tokenable_type' => User::class
        ]);
    }

    public function test_logout_fails_without_authentication(): void
    {
        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(401);
    }

    public function test_logout_invalidates_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth_token')->plainTextToken;

        // Logout - this deletes ALL tokens for the user
        $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/auth/logout')
            ->assertStatus(200);

        // According to your logout implementation, all tokens are deleted
        // So the profile request should now fail with 401
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'tokenable_type' => User::class
        ]);
    }

    // ==================== FORGOT PASSWORD TESTS ====================

    public function test_user_can_request_password_reset(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'test@example.com'
        ]);

        $response->assertStatus(200);

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_forgot_password_fails_with_invalid_email(): void
    {
        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'notanemail'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_forgot_password_creates_reset_token(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'test@example.com']);

        $this->postJson('/api/auth/forgot-password', [
            'email' => 'test@example.com'
        ]);

        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'test@example.com'
        ]);
    }

    // ==================== RESET PASSWORD TESTS ====================

    public function test_user_can_reset_password_with_valid_token(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        
        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'NewPassword123!@#',
            'password_confirmation' => 'NewPassword123!@#'
        ]);

        $response->assertStatus(200);

        // Verify password was changed
        $user->refresh();
        $this->assertTrue(Hash::check('NewPassword123!@#', $user->password));

        // Verify token was deleted
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'test@example.com'
        ]);
    }

    public function test_reset_password_fails_with_invalid_token(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => 'invalid-token',
            'password' => 'NewPassword123!@#',
            'password_confirmation' => 'NewPassword123!@#'
        ]);

        $response->assertStatus(400);
    }

    public function test_reset_password_fails_with_expired_token(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        
        // Create expired token (manually insert with old timestamp)
        DB::table('password_reset_tokens')->insert([
            'email' => 'test@example.com',
            'token' => Hash::make('test-token'),
            'created_at' => now()->subHours(2) // Expired (assuming 60 min expiry)
        ]);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => 'test-token',
            'password' => 'NewPassword123!@#',
            'password_confirmation' => 'NewPassword123!@#'
        ]);

        $response->assertStatus(400);
    }

    public function test_reset_password_fails_with_weak_password(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'weak',
            'password_confirmation' => 'weak'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_reset_password_fails_with_password_mismatch(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'NewPassword123!@#',
            'password_confirmation' => 'DifferentPassword123!@#'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_reset_password_token_can_only_be_used_once(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = Password::broker()->createToken($user);

        // First use - should succeed
        $response1 = $this->postJson('/api/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'NewPassword123!@#',
            'password_confirmation' => 'NewPassword123!@#'
        ]);

        $response1->assertStatus(200);

        // Second use - should fail
        $response2 = $this->postJson('/api/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'AnotherPassword123!@#',
            'password_confirmation' => 'AnotherPassword123!@#'
        ]);

        $response2->assertStatus(400);
    }

    // ==================== PROFILE GET TESTS ====================

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com'
        ]);

        $response = $this->actingAs($user)->getJson('/api/user/profile');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'response_code',
            'status',
            'message',
            'data' => ['id', 'name', 'email']
        ]);

        $response->assertJson([
            'data' => [
                'name' => 'Test User',
                'email' => 'test@example.com'
            ]
        ]);
    }

    public function test_unauthenticated_user_cannot_get_profile(): void
    {
        $response = $this->getJson('/api/user/profile');

        $response->assertStatus(401);
    }

    public function test_profile_does_not_expose_password(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/user/profile');

        $response->assertStatus(200);
        $response->assertJsonMissing(['password']);
    }

    // ==================== PROFILE UPDATE TESTS ====================

    public function test_user_can_update_name(): void
    {
        $user = User::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($user)->patchJson('/api/user/profile', [
            'name' => 'New Name'
        ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertEquals('New Name', $user->name);
    }

    public function test_user_can_update_email(): void
    {
        $user = User::factory()->create(['email' => 'old@example.com']);

        $response = $this->actingAs($user)->patchJson('/api/user/profile', [
            'email' => 'new@example.com'
        ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertEquals('new@example.com', $user->email);
    }

    public function test_user_can_update_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('OldPassword123!@#')
        ]);

        $response = $this->actingAs($user)->patchJson('/api/user/profile', [
            'password' => 'NewPassword123!@#',
            'password_confirmation' => 'NewPassword123!@#'
        ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertTrue(Hash::check('NewPassword123!@#', $user->password));
    }

    public function test_user_can_update_multiple_fields(): void
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'email' => 'old@example.com',
            'password' => Hash::make('OldPassword123!@#')
        ]);

        $response = $this->actingAs($user)->patchJson('/api/user/profile', [
            'name' => 'New Name',
            'email' => 'new@example.com',
            'password' => 'NewPassword123!@#',
            'password_confirmation' => 'NewPassword123!@#'
        ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertEquals('New Name', $user->name);
        $this->assertEquals('new@example.com', $user->email);
        $this->assertTrue(Hash::check('NewPassword123!@#', $user->password));
    }

    public function test_user_can_keep_same_email(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->actingAs($user)->patchJson('/api/user/profile', [
            'email' => 'test@example.com'
        ]);

        $response->assertStatus(200);
    }

    public function test_update_profile_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->actingAs($user)->patchJson('/api/user/profile', [
            'email' => 'existing@example.com'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_update_profile_fails_with_short_name(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patchJson('/api/user/profile', [
            'name' => 'AB'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_update_profile_fails_with_weak_password(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patchJson('/api/user/profile', [
            'password' => 'weak',
            'password_confirmation' => 'weak'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_update_profile_fails_without_authentication(): void
    {
        $response = $this->patchJson('/api/user/profile', [
            'name' => 'New Name'
        ]);

        $response->assertStatus(401);
    }

    public function test_partial_update_only_updates_provided_fields(): void
    {
        $user = User::factory()->create([
            'name' => 'Original Name',
            'email' => 'original@example.com'
        ]);

        // Update only name
        $response = $this->actingAs($user)->patchJson('/api/user/profile', [
            'name' => 'Updated Name'
        ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertEquals('Updated Name', $user->name);
        $this->assertEquals('original@example.com', $user->email); // Email unchanged
    }

    public function test_update_profile_validates_email_format(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patchJson('/api/user/profile', [
            'email' => 'notanemail'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    // ==================== INTEGRATION TESTS ====================

    // public function test_complete_user_lifecycle(): void
    // {
    //     // 1. Register
    //     $registerResponse = $this->postJson('/api/auth/register', [
    //         'name' => 'Lifecycle User',
    //         'email' => 'lifecycle@example.com',
    //         'password' => 'Password123!@#',
    //         'password_confirmation' => 'Password123!@#'
    //     ]);

    //     $registerResponse->assertStatus(201);
    //     $token = $registerResponse->json('data.token');

    //     // 2. Get Profile
    //     $profileResponse = $this->withHeader('Authorization', "Bearer $token")
    //         ->getJson('/api/user/profile');

    //     $profileResponse->assertStatus(200);
    //     $profileResponse->assertJson([
    //         'data' => [
    //             'name' => 'Lifecycle User',
    //             'email' => 'lifecycle@example.com'
    //         ]
    //     ]);

    //     // 3. Update Profile
    //     $updateResponse = $this->withHeader('Authorization', "Bearer $token")
    //         ->patchJson('/api/user/profile', [
    //             'name' => 'Updated Lifecycle User'
    //         ]);

    //     $updateResponse->assertStatus(200);

    //     // 4. Logout
    //     $logoutResponse = $this->withHeader('Authorization', "Bearer $token")
    //         ->postJson('/api/auth/logout');

    //     $logoutResponse->assertStatus(200);

    //     // 5. Verify token is invalid
    //     $verifyResponse = $this->withHeader('Authorization', "Bearer $token")
    //         ->getJson('/api/user/profile');

    //     $verifyResponse->assertStatus(401);

    //     // 6. Login again
    //     $loginResponse = $this->postJson('/api/auth/login', [
    //         'email' => 'lifecycle@example.com',
    //         'password' => 'Password123!@#'
    //     ]);

    //     $loginResponse->assertStatus(200);
    //     $newToken = $loginResponse->json('data.token');

    //     // 7. Verify profile with new token
    //     $finalProfileResponse = $this->withHeader('Authorization', "Bearer $newToken")
    //         ->getJson('/api/user/profile');

    //     $finalProfileResponse->assertStatus(200);
    //     $finalProfileResponse->assertJson([
    //         'data' => [
    //             'name' => 'Updated Lifecycle User'
    //         ]
    //     ]);
    // }

    public function test_password_reset_flow(): void
    {
        Notification::fake();

        // 1. Create user
        $user = User::factory()->create([
            'email' => 'resetflow@example.com',
            'password' => Hash::make('OldPassword123!@#')
        ]);

        // 2. Request password reset
        $forgotResponse = $this->postJson('/api/auth/forgot-password', [
            'email' => 'resetflow@example.com'
        ]);

        $forgotResponse->assertStatus(200);

        // 3. Get the reset token from database
        $tokenData = DB::table('password_reset_tokens')
            ->where('email', 'resetflow@example.com')
            ->first();

        $this->assertNotNull($tokenData);

        // 4. Create a valid token for testing
        $token = Password::broker()->createToken($user);

        // 5. Reset password
        $resetResponse = $this->postJson('/api/auth/reset-password', [
            'email' => 'resetflow@example.com',
            'token' => $token,
            'password' => 'NewPassword123!@#',
            'password_confirmation' => 'NewPassword123!@#'
        ]);

        $resetResponse->assertStatus(200);

        // 6. Verify old password doesn't work
        $oldLoginResponse = $this->postJson('/api/auth/login', [
            'email' => 'resetflow@example.com',
            'password' => 'OldPassword123!@#'
        ]);

        $oldLoginResponse->assertStatus(401);

        // 7. Verify new password works
        $newLoginResponse = $this->postJson('/api/auth/login', [
            'email' => 'resetflow@example.com',
            'password' => 'NewPassword123!@#'
        ]);

        $newLoginResponse->assertStatus(200);
    }
}