<?php

namespace Database\Factories;

use App\Models\Tracker;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Tracker>
 */
class TrackerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Main Wallet', 'Bank Account', 'Emergency Fund', 'Vacation Savings', 'Investment Account', 'Side Business', 'Education Fund', 'Health Savings', 'Charity Fund']),
            'description' => fake()->optional()->sentence(),
        ];
    }
}
