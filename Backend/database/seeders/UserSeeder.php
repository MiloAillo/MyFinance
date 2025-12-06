<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
 public function run(): void
    {   
        $testUsers = [
            [
                'name' => 'John Doe',
                'email' => 'john@local.test',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Jane Smith', 
                'email' => 'jane@local.test',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Mavis Vermilion',
                'email' => 'mavis@local.test',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Zeref Dragneel',
                'email' => 'zeref@local.test',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Wendy Marvell',
                'email' => 'wendy@local.test',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Lucy Heartfilia',
                'email' => 'lucy@local.test',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Juvia Lockser',
                'email' => 'juvia@local.test',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Erza Scarlet',
                'email' => 'erza@local.test',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Gray Fullbuster',
                'email' => 'gray@local.test',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Natsu Dragneel',
                'email' => 'natsu@local.test',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Happy Cat',
                'email' => 'happy@local.test',
                'password' => Hash::make('password123'),
            ],
        ];
        
        foreach ($testUsers as $userData) {
            User::create($userData);
        }

        $totalUsers = User::count();
        $this->command->info("Successfully seeded {$totalUsers} users.");
    }
}
