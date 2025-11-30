<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tracker extends Model
{
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getCurrentBalanceAttribute()
    {
        $totalIncome = $this->transactions()
            ->where('type', 'income')
            ->sum('amount');

        $totalExpense = $this->transactions()
            ->where('type', 'expense')
            ->sum('amount');

        return $this->initial_balance + $totalIncome - $totalExpense;
    }
}
