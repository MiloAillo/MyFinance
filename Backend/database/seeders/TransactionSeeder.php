<?php

namespace Database\Seeders;

use App\Models\Tracker;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $trackers = Tracker::all();
        
        if ($trackers->isEmpty()) {
            $this->command->error('No trackers found! Run TrackerSeeder first.');
            return;
        }
        
        $this->command->info('Creating transactions for ' . $trackers->count() . ' trackers...');
    
        $totalTransactions = 0;
        
        $trackers->each(function ($tracker) use (&$totalTransactions) {
            $transactionCount = rand(8, 50);
            Transaction::factory()
                ->count($transactionCount)
                ->create([
                    'tracker_id' => $tracker->id,
                    'user_id' => $tracker->user_id,
                ]);
            
            $totalTransactions += $transactionCount;
            
            $this->command->info("Tracker {$tracker->id}: now has {$transactionCount} transactions");
        });
        
        $finalCount = Transaction::count();
        $this->command->info("Total transactions created: {$finalCount}");
        $this->showTransactionSummary();
    }
    
    private function showTransactionSummary(): void
    {
        $summary = DB::table('transactions')
            ->select(
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN type = "income" THEN 1 ELSE 0 END) as income_count'),
                DB::raw('SUM(CASE WHEN type = "expense" THEN 1 ELSE 0 END) as expense_count'),
                DB::raw('AVG(amount) as average_amount'),
                DB::raw('MIN(transaction_date) as earliest_date'),
                DB::raw('MAX(transaction_date) as latest_date')
            )
            ->first();
        
        $this->command->info("TRANSACTION SUMMARY:");
        $this->command->info("Total Transactions: " . $summary->total);
        $this->command->info("Income Transactions: " . $summary->income_count);
        $this->command->info("Expense Transactions: " . $summary->expense_count);
        $this->command->info("Average Amount: Rp " . number_format($summary->average_amount, 2));
        $this->command->info("Date Range: " . $summary->earliest_date . " to " . $summary->latest_date);
        
        // Tampilkan per tracker
        $trackerSummary = DB::table('transactions')
            ->join('trackers', 'transactions.tracker_id', '=', 'trackers.id')
            ->select(
                'trackers.id',
                'trackers.name',
                DB::raw('COUNT(transactions.id) as transaction_count'),
                DB::raw('SUM(CASE WHEN transactions.type = "income" THEN transactions.amount ELSE 0 END) as total_income'),
                DB::raw('SUM(CASE WHEN transactions.type = "expense" THEN transactions.amount ELSE 0 END) as total_expense')
            )
            ->groupBy('trackers.id', 'trackers.name')
            ->limit(5)
            ->get();
        
        $this->command->info("TOP 5 TRACKERS:");
        $trackerSummary->each(function ($tracker) {
            $balance = $tracker->total_income - $tracker->total_expense;
            $this->command->info("{$tracker->name} (ID: {$tracker->id}):");
            $this->command->info("Transactions: {$tracker->transaction_count}");
            $this->command->info("Income: Rp " . number_format($tracker->total_income, 2));
            $this->command->info("Expense: Rp " . number_format($tracker->total_expense, 2));
            $this->command->info("Balance: Rp " . number_format($balance, 2));
        });
    }
}
