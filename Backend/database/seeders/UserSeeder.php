<?php

namespace Database\Seeders;

use App\Models\Tracker;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $testUser = User::factory()->create([
            'name' => 'User',
            'email' => 'user@myfinance.test',
            'password' => Hash::make('User123!'),
            'email_verified_at' => null,
        ]);

        $randomUsers = User::factory(9)->create();

        $allUsers = $randomUsers->push($testUser);

        foreach ($allUsers as $user) {
            Tracker::factory(rand(2, 4))->create([
                'user_id' => $user->id
            ])->each(function ($tracker) use ($user) {
                
                $transactions = Transaction::factory(rand(10, 100))->create([
                    'tracker_id' => $tracker->id,
                    'user_id' => $user->id,
                ]);

                $totalIncome = $transactions->where('type', 'income')->sum('amount');
                $totalExpense = $transactions->where('type', 'expense')->sum('amount');
                
                $calculatedBalance = $totalIncome - $totalExpense;

                $tracker->current_balance = $calculatedBalance;
                $tracker->save();
            });
        }
    }
}
