<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tracker;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders(['Accept' => 'application/json']);
    }

    // ==================== INDEX TESTS ====================

    public function test_user_can_get_all_trackers(): void
    {
        $user = User::factory()->create();
        $trackers = collect([
            Tracker::create(['user_id' => $user->id, 'name' => 'Tracker 1', 'initial_balance' => 100]),
            Tracker::create(['user_id' => $user->id, 'name' => 'Tracker 2', 'initial_balance' => 200]),
            Tracker::create(['user_id' => $user->id, 'name' => 'Tracker 3', 'initial_balance' => 300]),
        ]);

        $response = $this->actingAs($user)->getJson('/api/trackers');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'response_code',
            'status',
            'message',
            'data' => [
                'trackers' => [
                    '*' => ['id', 'name', 'initial_balance', 'user_id']
                ]
            ]
        ]);
        $response->assertJsonCount(3, 'data.trackers');
    }

    public function test_user_only_sees_own_trackers(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        
        Tracker::create(['user_id' => $user1->id, 'name' => 'User 1 Tracker 1', 'initial_balance' => 100]);
        Tracker::create(['user_id' => $user1->id, 'name' => 'User 1 Tracker 2', 'initial_balance' => 200]);
        Tracker::create(['user_id' => $user2->id, 'name' => 'User 2 Tracker 1', 'initial_balance' => 300]);
        Tracker::create(['user_id' => $user2->id, 'name' => 'User 2 Tracker 2', 'initial_balance' => 400]);
        Tracker::create(['user_id' => $user2->id, 'name' => 'User 2 Tracker 3', 'initial_balance' => 500]);

        $response = $this->actingAs($user1)->getJson('/api/trackers');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data.trackers');
        
        foreach ($response->json('data.trackers') as $tracker) {
            $this->assertEquals($user1->id, $tracker['user_id']);
        }
    }

    public function test_unauthenticated_user_cannot_get_trackers(): void
    {
        $response = $this->getJson('/api/trackers');

        $response->assertStatus(401);
    }

    public function test_get_trackers_returns_empty_array_when_no_trackers(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/trackers');

        $response->assertStatus(200);
        $response->assertJson(['data' => ['trackers' => []]]);
    }

    // ==================== STORE TESTS ====================

    public function test_user_can_create_tracker(): void
    {
        $user = User::factory()->create();

        $trackerData = [
            'name' => 'Test Tracker',
            'initial_balance' => 1000.50
        ];

        $response = $this->actingAs($user)->postJson('/api/trackers', $trackerData);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'response_code',
            'status',
            'message',
            'data'
        ]);

        $this->assertDatabaseHas('trackers', [
            'name' => 'Test Tracker',
            'initial_balance' => 1000.50,
            'user_id' => $user->id
        ]);
    }

    public function test_create_tracker_fails_with_missing_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/trackers', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'initial_balance']);
    }

    public function test_create_tracker_allows_zero_balance(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/trackers', [
            'name' => 'Zero Balance Tracker',
            'initial_balance' => 0
        ]);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('trackers', [
            'name' => 'Zero Balance Tracker',
            'initial_balance' => 0,
            'user_id' => $user->id
        ]);
    }

    public function test_create_tracker_fails_with_negative_balance(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/trackers', [
            'name' => 'Negative Balance Tracker',
            'initial_balance' => -500.25
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['initial_balance']);
    }

    // ==================== SHOW TESTS ====================

    public function test_user_can_get_own_tracker(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user)->getJson("/api/trackers/{$tracker->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'response_code',
            'status',
            'message',
            'data' => [
                'tracker' => [
                    'id', 'name', 'initial_balance', 'user_id'
                ]
            ]
        ]);

        $response->assertJson([
            'data' => [
                'tracker' => [
                    'id' => $tracker->id,
                    'name' => $tracker->name
                ]
            ]
        ]);
    }

    public function test_user_cannot_get_other_users_tracker(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user2->id, 'name' => 'User 2 Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user1)->getJson("/api/trackers/{$tracker->id}");

        $response->assertStatus(403);
    }

    public function test_get_tracker_returns_404_for_non_existent_tracker(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/trackers/999');

        $response->assertStatus(404);
    }

    // ==================== UPDATE TESTS ====================

    public function test_user_can_update_own_tracker(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create([
            'user_id' => $user->id,
            'name' => 'Old Name',
            'initial_balance' => 1000
        ]);

        $response = $this->actingAs($user)->patchJson("/api/trackers/{$tracker->id}", [
            'name' => 'Updated Name'
        ]);

        $response->assertStatus(200);

        $tracker->refresh();
        $this->assertEquals('Updated Name', $tracker->name);
    }

    public function test_user_cannot_update_other_users_tracker(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user2->id, 'name' => 'User 2 Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user1)->patchJson("/api/trackers/{$tracker->id}", [
            'name' => 'Hacked Name'
        ]);

        $response->assertStatus(403);
    }

    // ==================== DELETE TESTS ====================

    public function test_user_can_delete_own_tracker(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user)->deleteJson("/api/trackers/{$tracker->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('trackers', ['id' => $tracker->id]);
    }

    public function test_user_cannot_delete_other_users_tracker(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user2->id, 'name' => 'User 2 Tracker', 'initial_balance' => 1000]);

        $response = $this->actingAs($user1)->deleteJson("/api/trackers/{$tracker->id}");

        $response->assertStatus(403);

        $this->assertDatabaseHas('trackers', ['id' => $tracker->id]);
    }

    // ==================== CURRENT BALANCE TESTS ====================

    public function test_current_balance_calculation_with_transactions(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Balance Test', 'initial_balance' => 1000]);

        // Add income transaction
        Transaction::create([
            'user_id' => $user->id,
            'tracker_id' => $tracker->id,
            'name' => 'Income',
            'type' => 'income',
            'amount' => 500,
            'transaction_date' => now()
        ]);

        // Add expense transaction
        Transaction::create([
            'user_id' => $user->id,
            'tracker_id' => $tracker->id,
            'name' => 'Expense',
            'type' => 'expense',
            'amount' => 200,
            'transaction_date' => now()
        ]);

        $expectedBalance = 1000 + 500 - 200; // 1300

        $this->assertEquals($expectedBalance, $tracker->current_balance);
    }

    public function test_current_balance_with_no_transactions(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'No Transactions', 'initial_balance' => 750]);

        $this->assertEquals(750, $tracker->current_balance);
    }

    public function test_current_balance_with_multiple_income_and_expenses(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Multiple Transactions', 'initial_balance' => 0]);

        // Multiple income transactions
        Transaction::create(['user_id' => $user->id, 'tracker_id' => $tracker->id, 'name' => 'Income 1', 'type' => 'income', 'amount' => 1000, 'transaction_date' => now()]);
        Transaction::create(['user_id' => $user->id, 'tracker_id' => $tracker->id, 'name' => 'Income 2', 'type' => 'income', 'amount' => 500, 'transaction_date' => now()]);

        // Multiple expense transactions  
        Transaction::create(['user_id' => $user->id, 'tracker_id' => $tracker->id, 'name' => 'Expense 1', 'type' => 'expense', 'amount' => 300, 'transaction_date' => now()]);
        Transaction::create(['user_id' => $user->id, 'tracker_id' => $tracker->id, 'name' => 'Expense 2', 'type' => 'expense', 'amount' => 100, 'transaction_date' => now()]);
        Transaction::create(['user_id' => $user->id, 'tracker_id' => $tracker->id, 'name' => 'Expense 3', 'type' => 'expense', 'amount' => 250, 'transaction_date' => now()]);

        $expectedBalance = 0 + (1000 + 500) - (300 + 100 + 250); // 850

        $this->assertEquals($expectedBalance, $tracker->current_balance);
    }

    // ==================== ACTIVE SCOPE TESTS ====================

    public function test_active_scope_returns_only_active_trackers(): void
    {
        $user = User::factory()->create();
        
        $activeTracker = Tracker::create(['user_id' => $user->id, 'name' => 'Active Tracker', 'initial_balance' => 1000, 'is_active' => true]);
        $inactiveTracker = Tracker::create(['user_id' => $user->id, 'name' => 'Inactive Tracker', 'initial_balance' => 1000, 'is_active' => false]);

        $activeTrackers = Tracker::active()->get();

        $this->assertCount(1, $activeTrackers);
        $this->assertEquals($activeTracker->id, $activeTrackers->first()->id);
    }

    // ==================== RELATIONSHIP TESTS ====================

    public function test_tracker_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        $this->assertInstanceOf(User::class, $tracker->user);
        $this->assertEquals($user->id, $tracker->user->id);
    }

    public function test_tracker_has_many_transactions(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::create(['user_id' => $user->id, 'name' => 'Test Tracker', 'initial_balance' => 1000]);

        Transaction::create(['user_id' => $user->id, 'tracker_id' => $tracker->id, 'name' => 'Transaction 1', 'type' => 'income', 'amount' => 100, 'transaction_date' => now()]);
        Transaction::create(['user_id' => $user->id, 'tracker_id' => $tracker->id, 'name' => 'Transaction 2', 'type' => 'expense', 'amount' => 50, 'transaction_date' => now()]);

        $this->assertCount(2, $tracker->transactions);
        $this->assertEquals('Transaction 1', $tracker->transactions->first()->name);
    }

    // ==================== VALIDATION TESTS ====================

    public function test_tracker_requires_name(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/trackers', [
            'initial_balance' => 1000
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_tracker_requires_initial_balance(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/trackers', [
            'name' => 'Test Tracker'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['initial_balance']);
    }

    public function test_tracker_name_cannot_be_empty_string(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/trackers', [
            'name' => '',
            'initial_balance' => 1000
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_initial_balance_must_be_numeric(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/trackers', [
            'name' => 'Test Tracker',
            'initial_balance' => 'not-a-number'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['initial_balance']);
    }

    // ==================== EDGE CASE TESTS ====================

    public function test_tracker_with_very_large_balance(): void
    {
        $user = User::factory()->create();
        $largeBalance = 999999999.99;

        $response = $this->actingAs($user)->postJson('/api/trackers', [
            'name' => 'Large Balance Tracker',
            'initial_balance' => $largeBalance
        ]);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('trackers', [
            'name' => 'Large Balance Tracker',
            'initial_balance' => $largeBalance,
            'user_id' => $user->id
        ]);
    }

    public function test_tracker_with_decimal_balance(): void
    {
        $user = User::factory()->create();
        $decimalBalance = 123.45;

        $response = $this->actingAs($user)->postJson('/api/trackers', [
            'name' => 'Decimal Balance Tracker',
            'initial_balance' => $decimalBalance
        ]);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('trackers', [
            'name' => 'Decimal Balance Tracker',
            'initial_balance' => $decimalBalance,
            'user_id' => $user->id
        ]);
    }
}