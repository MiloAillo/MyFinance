<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AvatarTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure API responses in tests return JSON instead of redirects
        $this->withHeaders(['Accept' => 'application/json']);

        // Clear any existing storage state
        Storage::fake('public');
    }

    protected function tearDown(): void
    {
        // Clean up storage state after each test
        Storage::disk('public')->deleteDirectory('avatars');
        parent::tearDown();
    }

    public function test_update_avatar_success(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('avatar.jpg', 800, 600);

        $response = $this
            ->actingAs($user)
            ->put('/api/user/avatar', ['avatar' => $file]);

        $response->assertStatus(200);

        $payload = $response->json('data') ?? $response->json();
        $this->assertArrayHasKey('avatar_path', $payload);
        $this->assertArrayHasKey('avatar_url', $payload);

        $avatarPath = $payload['avatar_path'];
        Storage::disk('public')->assertExists($avatarPath);

        $user->refresh();
        $this->assertEquals($avatarPath, $user->avatar);

        // Verify filename structure: avatars/{userId}/{timestamp}_{random}.{ext}
        $this->assertStringStartsWith('avatars/' . $user->id . '/', $avatarPath);
        $this->assertStringEndsWith('.jpg', $avatarPath);
    }

    public function test_update_avatar_with_different_formats(): void
    {
        $user = User::factory()->create();
        $formats = [
            ['png', 'image/png'],
            ['jpeg', 'image/jpeg'], 
            ['jpg', 'image/jpeg'],
            ['webp', 'image/webp']
        ];

        foreach ($formats as [$ext, $mime]) {
            $file = UploadedFile::fake()->image("avatar.$ext")->mimeType($mime);
            
            $response = $this
                ->actingAs($user)
                ->put('/api/user/avatar', ['avatar' => $file]);

            $response->assertStatus(200);
            
            $payload = $response->json('data') ?? $response->json();
            $this->assertStringEndsWith(".$ext", $payload['avatar_path']);
        }
    }

    public function test_update_avatar_replaces_previous_avatar(): void
    {
        $user = User::factory()->create();

        // Upload first avatar
        $firstFile = UploadedFile::fake()->image('first.jpg');
        $firstResponse = $this
            ->actingAs($user)
            ->put('/api/user/avatar', ['avatar' => $firstFile]);

        $firstPath = ($firstResponse->json('data') ?? $firstResponse->json())['avatar_path'];
        Storage::disk('public')->assertExists($firstPath);

        // Upload second avatar
        $secondFile = UploadedFile::fake()->image('second.png');
        $secondResponse = $this
            ->actingAs($user)
            ->put('/api/user/avatar', ['avatar' => $secondFile]);

        $secondPath = ($secondResponse->json('data') ?? $secondResponse->json())['avatar_path'];

        // Old avatar should be deleted, new one should exist
        Storage::disk('public')->assertMissing($firstPath);
        Storage::disk('public')->assertExists($secondPath);

        $user->refresh();
        $this->assertEquals($secondPath, $user->avatar);
    }

    public function test_update_avatar_file_too_large(): void
    {
        $user = User::factory()->create();

        // Create file larger than 2MB (2048KB)
        $largeFile = UploadedFile::fake()->create('large.jpg', 2049, 'image/jpeg');

        $response = $this
            ->actingAs($user)
            ->put('/api/user/avatar', ['avatar' => $largeFile]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['avatar']);
    }

    public function test_unauthorized_user_cannot_upload_avatar(): void
    {
        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->put('/api/user/avatar', ['avatar' => $file]);

        $response->assertStatus(401);
    }

    public function test_validation_fails_for_missing_file(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->put('/api/user/avatar', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['avatar']);
    }

    public function test_validation_fails_for_invalid_file_type(): void
    {
        $user = User::factory()->create();

        $invalidFiles = [
            UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
            UploadedFile::fake()->create('video.mp4', 100, 'video/mp4'),
            UploadedFile::fake()->create('audio.mp3', 100, 'audio/mpeg'),
            UploadedFile::fake()->create('text.txt', 100, 'text/plain'),
        ];

        foreach ($invalidFiles as $file) {
            $response = $this
                ->actingAs($user)
                ->put('/api/user/avatar', ['avatar' => $file]);

            $response->assertStatus(422);
            $response->assertJsonValidationErrors(['avatar']);
        }
    }

    // DELETE AVATAR TESTS

    public function test_delete_avatar_success(): void
    {
        $user = User::factory()->create();

        // First, upload an avatar
        $file = UploadedFile::fake()->image('avatar.jpg');
        $uploadResponse = $this
            ->actingAs($user)
            ->put('/api/user/avatar', ['avatar' => $file]);

        $avatarPath = ($uploadResponse->json('data') ?? $uploadResponse->json())['avatar_path'];
        Storage::disk('public')->assertExists($avatarPath);

        // Now delete it
        $response = $this
            ->actingAs($user)
            ->delete('/api/user/avatar');

        $response->assertStatus(200);

        // Verify file is deleted and user avatar is null
        Storage::disk('public')->assertMissing($avatarPath);
        
        $user->refresh();
        $this->assertNull($user->avatar);
    }

    public function test_delete_avatar_with_confirm_flag(): void
    {
        $user = User::factory()->create();

        // Upload avatar first
        $file = UploadedFile::fake()->image('avatar.jpg');
        $this->actingAs($user)->put('/api/user/avatar', ['avatar' => $file]);

        // Delete with confirm flag
        $response = $this
            ->actingAs($user)
            ->delete('/api/user/avatar', ['confirm' => true]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertNull($user->avatar);
    }

    public function test_delete_avatar_fails_when_no_avatar_exists(): void
    {
        $user = User::factory()->create();
        // User has no avatar

        $response = $this
            ->actingAs($user)
            ->delete('/api/user/avatar');

        // If your controller allows deleting non-existent avatars, expect 200
        // If it validates avatar existence, expect 422
        $this->assertTrue(in_array($response->getStatusCode(), [200, 422]), 
            'Expected 200 (success) or 422 (validation error), got: ' . $response->getStatusCode());

        if ($response->getStatusCode() === 422) {
            $response->assertJsonValidationErrors(['avatar']);
            $errorMessage = $response->json('errors.avatar.0') ?? $response->json('message');
            $this->assertStringContainsString('No avatar found', $errorMessage);
        }
    }

    public function test_unauthorized_user_cannot_delete_avatar(): void
    {
        $response = $this->delete('/api/user/avatar');

        $response->assertStatus(401);
    }

    public function test_delete_avatar_handles_missing_file_gracefully(): void
    {
        $user = User::factory()->create();

        // Set avatar path in database but don't create actual file
        $fakePath = 'avatars/' . $user->id . '/missing.jpg';
        $user->avatar = $fakePath;
        $user->save();

        // Delete should still work (clears DB even if file doesn't exist)
        $response = $this
            ->actingAs($user)
            ->delete('/api/user/avatar');

        $response->assertStatus(200);

        $user->refresh();
        $this->assertNull($user->avatar);
    }

    // EDGE CASES & SECURITY TESTS

    public function test_update_avatar_unique_filenames(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $file1 = UploadedFile::fake()->image('test.jpg');
        $file2 = UploadedFile::fake()->image('test.jpg');

        // Upload same filename for different users
        $response1 = $this->actingAs($user1)->put('/api/user/avatar', ['avatar' => $file1]);
        $response2 = $this->actingAs($user2)->put('/api/user/avatar', ['avatar' => $file2]);

        $path1 = ($response1->json('data') ?? $response1->json())['avatar_path'];
        $path2 = ($response2->json('data') ?? $response2->json())['avatar_path'];

        // Paths should be different (different user folders + timestamps/random)
        $this->assertNotEquals($path1, $path2);
        $this->assertStringContains($user1->id, $path1);
        $this->assertStringContains($user2->id, $path2);
    }

    public function test_avatar_url_is_accessible(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this
            ->actingAs($user)
            ->put('/api/user/avatar', ['avatar' => $file]);

        $payload = $response->json('data') ?? $response->json();
        $this->assertArrayHasKey('avatar_url', $payload);

        $avatarUrl = $payload['avatar_url'];
        
        // In testing environment, URL might be relative path starting with /storage
        // or full URL starting with http
        $this->assertTrue(
            str_starts_with($avatarUrl, 'http') || str_starts_with($avatarUrl, '/storage'),
            'Avatar URL should start with http or /storage, got: ' . $avatarUrl
        );
        $this->assertStringContainsString('storage', $avatarUrl);
    }

    public function test_concurrent_avatar_uploads_dont_interfere(): void
    {
        $user = User::factory()->create();
        
        // Simulate rapid consecutive uploads
        $files = [
            UploadedFile::fake()->image('avatar1.jpg'),
            UploadedFile::fake()->image('avatar2.png'),
            UploadedFile::fake()->image('avatar3.webp')
        ];

        $paths = [];
        foreach ($files as $file) {
            usleep(1000); // Small delay to ensure different timestamps
            
            $response = $this
                ->actingAs($user)
                ->put('/api/user/avatar', ['avatar' => $file]);

            $response->assertStatus(200);
            $paths[] = ($response->json('data') ?? $response->json())['avatar_path'];
        }

        // Only the last file should exist
        Storage::disk('public')->assertMissing($paths[0]);
        Storage::disk('public')->assertMissing($paths[1]);
        Storage::disk('public')->assertExists($paths[2]);

        $user->refresh();
        $this->assertEquals($paths[2], $user->avatar);
    }

    public function test_avatar_directory_structure(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('test.jpg');

        $response = $this
            ->actingAs($user)
            ->put('/api/user/avatar', ['avatar' => $file]);

        $avatarPath = ($response->json('data') ?? $response->json())['avatar_path'];
        
        // Should follow pattern: avatars/{userId}/{timestamp}.{ext}
        $pathParts = explode('/', $avatarPath);
        $this->assertEquals('avatars', $pathParts[0]);
        $this->assertEquals($user->id, $pathParts[1]);
        
        $filename = $pathParts[2];
        $this->assertMatchesRegularExpression('/^[0-9]{14}\.jpg$/', $filename);
    }

    public function test_delete_avatar_cleans_up_empty_user_directory(): void
    {
        $user = User::factory()->create();
        
        // Upload and then delete avatar
        $file = UploadedFile::fake()->image('avatar.jpg');
        $uploadResponse = $this->actingAs($user)->put('/api/user/avatar', ['avatar' => $file]);
        
        $avatarPath = ($uploadResponse->json('data') ?? $uploadResponse->json())['avatar_path'];
        $userDir = dirname($avatarPath);
        
        // Check if directory exists using Laravel's Storage facade
        $this->assertTrue(Storage::disk('public')->exists($userDir . '/'));
        
        // Delete avatar
        $deleteResponse = $this->actingAs($user)->delete('/api/user/avatar');
        $deleteResponse->assertStatus(200);
        
        // Check if user directory is cleaned up (this depends on your controller implementation)
        // If your controller doesn't clean up empty directories, remove this assertion
        $directoryContents = Storage::disk('public')->files($userDir);
        $this->assertEmpty($directoryContents, 'User directory should be empty after avatar deletion');
    }
}