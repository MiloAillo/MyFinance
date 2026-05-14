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

    public function scopeDynamicDateFilter(Builder $query, string $value, string $type)
    {
        $whitelistColumns = ['date', 'created_at', 'updated_at'];
        $params = explode(',', $value);
        $column = $params[0];
        $date1 = $params[1] ?? null;
        $date2 = $params[2] ?? null;
        $operator =
            $type === 'between' ? '>=' : (
                $type === 'before' ? '<=' : (
                    $type === 'after' ? '>=' : null
                )
            );

        if (!in_array($column, $whitelistColumns) || is_null($operator)) return $query;

        try {
            $date1 = Carbon::parse($date1);

            if ($type === 'between') {
                $date2 = Carbon::parse($date2);
                return $query->whereBetween($column, [$date1, $date2]);
            }
            return $query->where($column, $operator, $date1);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("[URL Parameters Error] Dynamic Date Filter Error: " . $e->getMessage());
            
            return $query;
        }
    }
}