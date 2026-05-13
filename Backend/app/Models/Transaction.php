<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tracker_id',
        'user_id',
        'name',
        'type',
        'amount',
        'description',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'date' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tracker()
    {
        return $this->belongsTo(Tracker::class);
    }

    public function scopeStartsBefore(Builder $query, string $column, $date)
    {
        return $query->where($column, '<=', Carbon::parse($date));
    }

    public function scopeInBetween(Builder $query, string $column, $startDate, $endDate)
    {
        return $query->whereBetween($column, [Carbon::parse($startDate), Carbon::parse($endDate)]);
    }

    public function scopeEndsAfter(Builder $query, string $column, $date)
    {
        return $query->where($column, '>=', Carbon::parse($date));
    }
}