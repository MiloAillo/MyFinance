<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tracker;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TransactionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders(['Accept' => 'application/json']);
        Storage::fake('public');
    }

    protected function tearDown(): void
    {
        Storage::disk('public')->deleteDirectory('transactions');
        parent::tearDown();
    }

    // ==================== STORE TESTS ====================

    public function test_user_can_create_transaction(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $transactionData = [
            'name' => 'Test Transaction',
            'type' => 'expense',
            'amount' => 100.50,
            'description' => 'Test description',
            'transaction_date' => '2025-11-30'
        ];

        $response = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", $transactionData);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'response_code',
            'status',
            'message',
            'data'
        ]);

        $this->assertDatabaseHas('transactions', [
            'name' => 'Test Transaction',
            'type' => 'expense',
            'amount' => 100.50,
            'tracker_id' => $tracker->id,
            'user_id' => $user->id
        ]);
    }

    public function test_user_can_create_income_transaction(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Salary',
            'type' => 'income',
            'amount' => 5000,
            'transaction_date' => '2025-11-30'
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('transactions', [
            'name' => 'Salary',
            'type' => 'income',
            'amount' => 5000
        ]);
    }

    public function test_user_can_create_expense_transaction(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Groceries',
            'type' => 'expense',
            'amount' => 200,
            'transaction_date' => '2025-11-30'
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('transactions', [
            'name' => 'Groceries',
            'type' => 'expense',
            'amount' => 200
        ]);
    }

    public function test_user_can_create_transaction_with_image(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $image = UploadedFile::fake()->image('receipt.jpg', 800, 600);

        $response = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Transaction with Receipt',
            'type' => 'expense',
            'amount' => 50.00,
            'image' => $image,
            'transaction_date' => '2025-11-30'
        ]);

        $response->assertStatus(201);

        $transaction = Transaction::where('name', 'Transaction with Receipt')->first();
        $this->assertNotNull($transaction->image);
        
        Storage::disk('public')->assertExists($transaction->image);
    }

    public function test_create_transaction_fails_for_non_owned_tracker(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user2->id, 'name' => 'User 2 Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user1)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Unauthorized Transaction',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => '2025-11-30'
        ]);

        $response->assertStatus(403);
    }

    public function test_create_transaction_requires_name(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => '2025-11-30'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_create_transaction_requires_type(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Test Transaction',
            'amount' => 100,
            'transaction_date' => '2025-11-30'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['type']);
    }

    public function test_create_transaction_requires_amount(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Test Transaction',
            'type' => 'expense',
            'transaction_date' => '2025-11-30'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['amount']);
    }

    public function test_create_transaction_type_must_be_valid(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Test Transaction',
            'type' => 'invalid_type',
            'amount' => 100,
            'transaction_date' => '2025-11-30'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['type']);
    }

    public function test_create_transaction_amount_must_be_numeric(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Test Transaction',
            'type' => 'expense',
            'amount' => 'not_a_number',
            'transaction_date' => '2025-11-30'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['amount']);
    }

    public function test_create_transaction_amount_must_be_positive(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Test Transaction',
            'type' => 'expense',
            'amount' => -100,
            'transaction_date' => '2025-11-30'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['amount']);
    }

    public function test_create_transaction_date_must_be_valid(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Test Transaction',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => 'invalid_date'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['transaction_date']);
    }

    public function test_create_transaction_image_must_be_valid_format(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $invalidFile = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $response = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Test Transaction',
            'type' => 'expense',
            'amount' => 100,
            'image' => $invalidFile,
            'transaction_date' => '2025-11-30'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    }

    public function test_create_transaction_image_size_limit(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $largeFile = UploadedFile::fake()->create('large.jpg', 3000, 'image/jpeg');

        $response = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Test Transaction',
            'type' => 'expense',
            'amount' => 100,
            'image' => $largeFile,
            'transaction_date' => '2025-11-30'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    }

    public function test_unauthenticated_user_cannot_create_transaction(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Test Transaction',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => '2025-11-30'
        ]);

        $response->assertStatus(401);
    }

    // ==================== SHOW TESTS ====================

    public function test_user_can_get_own_transaction(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);
        $transaction = Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user->id,
            'name' => 'Test Transaction',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => now()
        ]);

        $response = $this->actingAs($user)->getJson("/api/trackers/{$tracker->id}/transactions/{$transaction->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'response_code',
            'status',
            'message',
            'data'
        ]);

        $response->assertJsonPath('data.transaction.id', $transaction->id);
        $response->assertJsonPath('data.transaction.name', 'Test Transaction');
    }

    public function test_user_cannot_get_other_users_transaction(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user2->id, 'name' => 'User 2 Tracker', 'initial_balance' => 1000]);
        $transaction = Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user2->id,
            'name' => 'User 2 Transaction',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => now()
        ]);

        $response = $this->actingAs($user1)->getJson("/api/trackers/{$tracker->id}/transactions/{$transaction->id}");

        $response->assertStatus(403);
    }

    public function test_get_transaction_returns_404_for_non_existent(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user)->getJson("/api/trackers/{$tracker->id}/transactions/999");

        $response->assertStatus(404);
    }

    // ==================== UPDATE TESTS ====================

    public function test_user_can_update_own_transaction(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);
        $transaction = Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user->id,
            'name' => 'Old Name',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => now()
        ]);

        $response = $this->actingAs($user)->patchJson("/api/trackers/{$tracker->id}/transactions/{$transaction->id}", [
            'name' => 'Updated Name',
            'amount' => 200
        ]);

        $response->assertStatus(200);

        $transaction->refresh();
        $this->assertEquals('Updated Name', $transaction->name);
        $this->assertEquals(200, $transaction->amount);
    }

    public function test_user_cannot_update_other_users_transaction(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user2->id, 'name' => 'User 2 Tracker', 'initial_balance' => 1000]);
        $transaction = Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user2->id,
            'name' => 'User 2 Transaction',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => now()
        ]);

        $response = $this->actingAs($user1)->patchJson("/api/trackers/{$tracker->id}/transactions/{$transaction->id}", [
            'name' => 'Hacked Name'
        ]);

        $response->assertStatus(403);
    }

    public function test_update_transaction_partial_update(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);
        $transaction = Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user->id,
            'name' => 'Original Name',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => now()
        ]);

        $response = $this->actingAs($user)->patchJson("/api/trackers/{$tracker->id}/transactions/{$transaction->id}", [
            'name' => 'Updated Name'
        ]);

        $response->assertStatus(200);

        $transaction->refresh();
        $this->assertEquals('Updated Name', $transaction->name);
        $this->assertEquals('expense', $transaction->type);
        $this->assertEquals(100, $transaction->amount);
    }

    public function test_update_transaction_with_new_image(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);
        
        $oldImage = UploadedFile::fake()->image('old_receipt.jpg');
        
        $createResponse = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Transaction with Receipt',
            'type' => 'expense',
            'amount' => 50,
            'image' => $oldImage,
            'transaction_date' => '2025-11-30'
        ]);

        $transaction = Transaction::where('name', 'Transaction with Receipt')->first();
        $oldImagePath = $transaction->image;

        $newImage = UploadedFile::fake()->image('new_receipt.jpg');

        $response = $this->actingAs($user)->patchJson("/api/trackers/{$tracker->id}/transactions/{$transaction->id}", [
            'image' => $newImage
        ]);

        $response->assertStatus(200);

        $transaction->refresh();
        $this->assertNotNull($transaction->image);
        $this->assertNotEquals($oldImagePath, $transaction->image);
        
        Storage::disk('public')->assertMissing($oldImagePath);
        Storage::disk('public')->assertExists($transaction->image);
    }

    // ==================== DELETE TESTS ====================

    public function test_user_can_delete_own_transaction(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);
        $transaction = Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user->id,
            'name' => 'Test Transaction',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => now()
        ]);

        $response = $this->actingAs($user)->deleteJson("/api/trackers/{$tracker->id}/transactions/{$transaction->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('transactions', ['id' => $transaction->id]);
    }

    public function test_user_cannot_delete_other_users_transaction(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user2->id, 'name' => 'User 2 Tracker', 'initial_balance' => 1000]);
        $transaction = Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user2->id,
            'name' => 'User 2 Transaction',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => now()
        ]);

        $response = $this->actingAs($user1)->deleteJson("/api/trackers/{$tracker->id}/transactions/{$transaction->id}");

        $response->assertStatus(403);

        $this->assertDatabaseHas('transactions', ['id' => $transaction->id]);
    }

    public function test_delete_transaction_removes_image(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $image = UploadedFile::fake()->image('receipt.jpg');

        $createResponse = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Transaction with Receipt',
            'type' => 'expense',
            'amount' => 50,
            'image' => $image,
            'transaction_date' => '2025-11-30'
        ]);

        $transaction = Transaction::where('name', 'Transaction with Receipt')->first();
        $imagePath = $transaction->image;

        Storage::disk('public')->assertExists($imagePath);

        $response = $this->actingAs($user)->deleteJson("/api/trackers/{$tracker->id}/transactions/{$transaction->id}");

        $response->assertStatus(200);

        Storage::disk('public')->assertMissing($imagePath);
    }

    // ==================== PAGINATION TESTS ====================

    public function test_user_can_paginate_transactions(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        for ($i = 1; $i <= 25; $i++) {
            Transaction::create([
                'tracker_id' => $tracker->id,
                'user_id' => $user->id,
                'name' => "Transaction $i",
                'type' => 'expense',
                'amount' => 100,
                'transaction_date' => now()
            ]);
        }

        $response = $this->actingAs($user)->getJson("/api/trackers/{$tracker->id}/paginate/transactions?page=1&per_page=10");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'response_code',
            'status',
            'message',
            'data' => [
                'transactions' => [
                    'data',
                    'current_page',
                    'per_page',
                    'total',
                    'last_page'
                ]
            ]
        ]);

        $response->assertJsonCount(10, 'data.transactions.data');
        $response->assertJsonPath('data.transactions.current_page', 1);
        $response->assertJsonPath('data.transactions.per_page', 10);
        $response->assertJsonPath('data.transactions.total', 25);
    }

    public function test_pagination_second_page(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        for ($i = 1; $i <= 15; $i++) {
            Transaction::create([
                'tracker_id' => $tracker->id,
                'user_id' => $user->id,
                'name' => "Transaction $i",
                'type' => 'expense',
                'amount' => 100,
                'transaction_date' => now()
            ]);
        }

        $response = $this->actingAs($user)->getJson("/api/trackers/{$tracker->id}/paginate/transactions?page=2&per_page=10");

        $response->assertStatus(200);
        $response->assertJsonCount(5, 'data.transactions.data');
        $response->assertJsonPath('data.transactions.current_page', 2);
    }

    // ==================== DATE RANGE TESTS ====================

    public function test_user_can_get_transactions_by_date_range(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user->id,
            'name' => 'November Transaction',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => '2025-11-15'
        ]);

        Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user->id,
            'name' => 'December Transaction',
            'type' => 'expense',
            'amount' => 200,
            'transaction_date' => '2025-12-15'
        ]);

        Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user->id,
            'name' => 'January Transaction',
            'type' => 'income',
            'amount' => 300,
            'transaction_date' => '2026-01-15'
        ]);

        $response = $this->actingAs($user)->getJson("/api/trackers/{$tracker->id}/range/transactions?start_date=2025-12-01&end_date=2025-12-31");

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data.transactions');
        $this->assertEquals('December Transaction', $response->json('data.transactions.0.name'));
    }

    public function test_date_range_validation_invalid_start_date(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user)->getJson("/api/trackers/{$tracker->id}/range/transactions?start_date=invalid&end_date=2025-12-31");

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['start_date']);
    }

    public function test_date_range_validation_end_before_start(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user)->getJson("/api/trackers/{$tracker->id}/range/transactions?start_date=2025-12-31&end_date=2025-12-01");

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['end_date']);
    }

    // ==================== SEARCH TESTS ====================

    public function test_user_can_search_transactions(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user->id,
            'name' => 'Grocery Shopping',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => now()
        ]);

        Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user->id,
            'name' => 'Gas Station',
            'type' => 'expense',
            'amount' => 50,
            'transaction_date' => now()
        ]);

        Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user->id,
            'name' => 'Online Shopping',
            'type' => 'expense',
            'amount' => 75,
            'transaction_date' => now()
        ]);

        $response = $this->actingAs($user)->getJson('/api/search/transactions?query=shopping');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data.transactions');
    }

    public function test_search_transactions_case_insensitive(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user->id,
            'name' => 'GROCERY SHOPPING',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => now()
        ]);

        $response = $this->actingAs($user)->getJson('/api/search/transactions?query=grocery');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data.transactions');
    }

    public function test_search_transactions_only_returns_user_transactions(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $tracker1 = Tracker::create(['user_id' => $user1->id, 'name' => 'User 1 Tracker', 'initial_balance' => 1000]);
        $tracker2 = Tracker::create(['user_id' => $user2->id, 'name' => 'User 2 Tracker', 'initial_balance' => 1000]);

        Transaction::create([
            'tracker_id' => $tracker1->id,
            'user_id' => $user1->id,
            'name' => 'My Grocery',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => now()
        ]);

        Transaction::create([
            'tracker_id' => $tracker2->id,
            'user_id' => $user2->id,
            'name' => 'Grocery Shopping',
            'type' => 'expense',
            'amount' => 200,
            'transaction_date' => now()
        ]);

        $response = $this->actingAs($user1)->getJson('/api/search/transactions?query=grocery');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data.transactions');
        $this->assertEquals('My Grocery', $response->json('data.transactions.0.name'));
    }

    // ==================== SCOPE TESTS ====================

    public function test_income_scope_returns_only_income_transactions(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        Transaction::create(['tracker_id' => $tracker->id, 'user_id' => $user->id, 'name' => 'Salary', 'type' => 'income', 'amount' => 5000, 'transaction_date' => now()]);
        Transaction::create(['tracker_id' => $tracker->id, 'user_id' => $user->id, 'name' => 'Bonus', 'type' => 'income', 'amount' => 1000, 'transaction_date' => now()]);
        Transaction::create(['tracker_id' => $tracker->id, 'user_id' => $user->id, 'name' => 'Groceries', 'type' => 'expense', 'amount' => 200, 'transaction_date' => now()]);

        $incomeTransactions = Transaction::income()->get();

        $this->assertCount(2, $incomeTransactions);
        $this->assertTrue($incomeTransactions->every(fn($t) => $t->type === 'income'));
    }

    public function test_expense_scope_returns_only_expense_transactions(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        Transaction::create(['tracker_id' => $tracker->id, 'user_id' => $user->id, 'name' => 'Salary', 'type' => 'income', 'amount' => 5000, 'transaction_date' => now()]);
        Transaction::create(['tracker_id' => $tracker->id, 'user_id' => $user->id, 'name' => 'Groceries', 'type' => 'expense', 'amount' => 200, 'transaction_date' => now()]);
        Transaction::create(['tracker_id' => $tracker->id, 'user_id' => $user->id, 'name' => 'Gas', 'type' => 'expense', 'amount' => 50, 'transaction_date' => now()]);

        $expenseTransactions = Transaction::expense()->get();

        $this->assertCount(2, $expenseTransactions);
        $this->assertTrue($expenseTransactions->every(fn($t) => $t->type === 'expense'));
    }

    // ==================== RELATIONSHIP TESTS ====================

    public function test_transaction_belongs_to_tracker(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);
        $transaction = Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user->id,
            'name' => 'Test Transaction',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => now()
        ]);

        $this->assertInstanceOf(Tracker::class, $transaction->tracker);
        $this->assertEquals($tracker->id, $transaction->tracker->id);
    }

    public function test_transaction_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);
        $transaction = Transaction::create([
            'tracker_id' => $tracker->id,
            'user_id' => $user->id,
            'name' => 'Test Transaction',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => now()
        ]);

        $this->assertInstanceOf(User::class, $transaction->user);
        $this->assertEquals($user->id, $transaction->user->id);
    }

    // ==================== INTEGRATION TESTS ====================

    public function test_transaction_lifecycle(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        // Create transaction
        $createResponse = $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Test Lifecycle',
            'type' => 'expense',
            'amount' => 100,
            'description' => 'Test description',
            'transaction_date' => '2025-11-30'
        ]);

        $createResponse->assertStatus(201);
        $transactionId = $createResponse->json('data.transaction.id');

        // Get transaction
        $getResponse = $this->actingAs($user)->getJson("/api/trackers/{$tracker->id}/transactions/{$transactionId}");
        $getResponse->assertStatus(200);
        $getResponse->assertJsonPath('data.transaction.name', 'Test Lifecycle');
        $getResponse->assertJsonPath('data.transaction.type', 'expense');
        $getResponse->assertJsonPath('data.transaction.amount', 100);

        // Update transaction
        $updateResponse = $this->actingAs($user)->patchJson("/api/trackers/{$tracker->id}/transactions/{$transactionId}", [
            'name' => 'Updated Lifecycle',
            'amount' => 200
        ]);
        $updateResponse->assertStatus(200);

        // Verify update
        $verifyResponse = $this->actingAs($user)->getJson("/api/trackers/{$tracker->id}/transactions/{$transactionId}");
        $verifyResponse->assertJsonPath('data.transaction.name', 'Updated Lifecycle');
        $verifyResponse->assertJsonPath('data.transaction.amount', 200);

        // Delete transaction
        $deleteResponse = $this->actingAs($user)->deleteJson("/api/trackers/{$tracker->id}/transactions/{$transactionId}");
        $deleteResponse->assertStatus(200);

        // Verify deletion
        $this->assertDatabaseMissing('transactions', ['id' => $transactionId]);
    }

    public function test_tracker_transaction_relationship(): void
    {
        $user = User::factory()->create();
        $tracker1 = Tracker::create(['user_id' => $user->id, 'name' => 'Tracker 1', 'initial_balance' => 1000]);
        $tracker2 = Tracker::create(['user_id' => $user->id, 'name' => 'Tracker 2', 'initial_balance' => 2000]);

        $transaction1Response = $this->actingAs($user)->postJson("/api/trackers/{$tracker1->id}/transactions", [
            'name' => 'Tracker 1 Transaction',
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => '2025-11-30'
        ]);

        $transaction2Response = $this->actingAs($user)->postJson("/api/trackers/{$tracker2->id}/transactions", [
            'name' => 'Tracker 2 Transaction',
            'type' => 'income',
            'amount' => 200,
            'transaction_date' => '2025-11-30'
        ]);

        $tracker1->refresh();
        $tracker2->refresh();

        $this->assertCount(1, $tracker1->transactions);
        $this->assertCount(1, $tracker2->transactions);
        $this->assertEquals('Tracker 1 Transaction', $tracker1->transactions->first()->name);
        $this->assertEquals('Tracker 2 Transaction', $tracker2->transactions->first()->name);
    }

    public function test_multiple_transactions_affect_tracker_balance(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Income 1',
            'type' => 'income',
            'amount' => 500,
            'transaction_date' => '2025-11-30'
        ]);

        $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Expense 1',
            'type' => 'expense',
            'amount' => 200,
            'transaction_date' => '2025-11-30'
        ]);

        $this->actingAs($user)->postJson("/api/trackers/{$tracker->id}/transactions", [
            'name' => 'Income 2',
            'type' => 'income',
            'amount' => 300,
            'transaction_date' => '2025-11-30'
        ]);

        $tracker->refresh();
        $expectedBalance = 1000 + 500 - 200 + 300; // 1600

        $this->assertEquals($expectedBalance, $tracker->current_balance);
    }
}