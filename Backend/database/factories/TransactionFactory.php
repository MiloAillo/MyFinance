<?php

namespace Database\Factories;

use App\Models\Tracker;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Transaction>
 */
class TransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $transactionDate = $this->faker->dateTimeBetween('-6 months', 'now');
        $type = $this->faker->randomElement(['income', 'expense']);
        $trackerId = $this->faker->randomElement(Tracker::pluck('id'));
        
        return [
            'tracker_id' => $trackerId,
            'user_id' => Tracker::find($trackerId)->user_id,
            'name' => $this->generateTransactionName($type),
            'type' => $type,
            'amount' => $this->generateAmountBasedOnType($type),
            'description' => $this->faker->optional(0.7)->sentence(), // 70% have description
            'image' => null,
            'transaction_date' => $transactionDate,
            'created_at' => $transactionDate,
            'updated_at' => $transactionDate,
        ];
    }

    private function generateAmountBasedOnType(string $type): float
    {
        return $type === 'income' 
            ? $this->faker->randomFloat(2, 100000, 5000000)    // Income: 100k - 5jt
            : $this->faker->randomFloat(2, 10000, 2000000);    // Expense: 10k - 2jt
    }

    // Helper method untuk generate nama transaksi yang realistis
    private function generateTransactionName(string $type): string
    {
        $incomeNames = [
            'Gaji Bulanan', 'Bonus', 'Freelance Project', 'Dividen Saham', 
            'Hasil Investasi', 'Penjualan Barang', 'Pengembalian Dana', 
            'Hadiah', 'Lembur', 'Tip', 'Bunga Bank', 'Royalti'
        ];
        
        $expenseNames = [
            'Belanja Bulanan', 'Makan di Restoran', 'Transportasi', 
            'Tagihan Listrik', 'Tagihan Air', 'Internet', 'Hiburan Netflix', 
            'Kesehatan', 'Biaya Pendidikan', 'Belanja Online', 'Bensin', 
            'Parkir', 'Tagihan Telepon', 'Donasi', 'Perawatan Kendaraan',
            'Pakaian', 'Elektronik', 'Sewa Kos', 'Iuran', 'Air Mineral'
        ];
        
        $names = $type === 'income' ? $incomeNames : $expenseNames;
        return $this->faker->randomElement($names);
    }
}
