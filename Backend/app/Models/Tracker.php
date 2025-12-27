<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tracker extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'initial_balance',
        'is_active',
    ];

    protected $casts = [
        'initial_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'current_balance',
        'total_transactions',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    // public function scopeActive($query)
    // {
    //     return $query->where('is_active', true);
    // }

    public function getCurrentBalanceAttribute()
    {
        if ($this->relationLoaded('transactions')) {
            $income = $this->transactions->where('type', 'income')->sum('amount');
            $expense = $this->transactions->where('type', 'expense')->sum('amount');
            return $this->initial_balance
                    + $income
                    - $expense;
        }
        
        $totals = $this->transactions()
            ->selectRaw('
                COALESCE(SUM(CASE WHEN type = "income" THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = "expense" THEN amount ELSE 0 END), 0) as expense
            ')
            ->first();
        
        return $this->initial_balance
                    + $totals->income
                    - $totals->expense;
    }

    public function getTotalTransactionsAttribute()
    {
        return $this->transactions()->count();
    }
}
