<?php

namespace Database\Seeders;

use App\Models\Tracker;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TrackerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
                // 1. Ambil semua user yang sudah dibuat
        $users = User::all();

        if ($users->isEmpty()) {
            $this->command->error('❌ No users found! Please run UserSeeder first.');
            return;
        }

        // 2. Untuk setiap user, buat 1-10 tracker
        $users->each(function ($user) {
            $trackerCount = rand(1, 10); // Setiap user punya 1-10 tracker

            Tracker::factory()
                ->count($trackerCount)
                ->create(['user_id' => $user->id]);
        });

        // 5. Log output
        $totalTrackers = Tracker::count();
        $activeTrackers = Tracker::where('is_active', true)->count();
        
        $this->command->info("Successfully seeded {$totalTrackers} trackers.");
        $this->command->info("   - Active: {$activeTrackers}");
        $this->command->info("   - Inactive: " . ($totalTrackers - $activeTrackers));
    }
}
