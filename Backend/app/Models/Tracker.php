<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tracker extends Model
{
    use HasFactory, SoftDeletes;
    
    protected $fillable = [
        'user_id',
        'name',
        'description',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function isForceDeletable()
    {
        return $this->deleted_at !== null;
    }

    public function getCurrentBalanceAttribute()
    {
        if ($this->relationLoaded('transactions')) {
            $income = $this->transactions->where('type', 'income')->sum('amount');
            $expense = $this->transactions->where('type', 'expense')->sum('amount');
            return $income - $expense;
        }
        
        $totals = $this->transactions()
            ->selectRaw('
                COALESCE(SUM(CASE WHEN type = "income" THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = "expense" THEN amount ELSE 0 END), 0) as expense
            ')
            ->first();
        
        return $totals->income - $totals->expense;
    }

    public function getTotalTransactionsAttribute()
    {
        return $this->transactions()->count();
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('name', 'like', "%{$search}%");
    }

    // public function scopeSortBy($query, $sortBy, $sortOrder)
    // {
    //     return $query->orderBy($sortBy, $sortOrder);
    // }
}
