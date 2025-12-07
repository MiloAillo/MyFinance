<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    const TYPES = ['income', 'expense'];
    
    protected $fillable = [
        'tracker_id',
        'user_id',
        'name',
        'type',
        'amount',
        'description',
        'image',
        'transaction_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'datetime',
    ];

    public function tracker()
    {
        return $this->belongsTo(Tracker::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeFilterByType($query, $type = null)
    {
        if (is_null($type)) {
            return $query->whereRaw('1 = 0');
        }

        if ($type === 'both') {
            return $query->whereIn('type', self::TYPES);
        }

        if (in_array($type, self::TYPES)) {
            return $query->where('type', $type);
        }

        return $query->whereRaw('1 = 0');
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }
    
    public function scopeByName($query, $name)
    {
        return $query->where('name', 'like', "%{$name}%");
    }

    public function getImageUrlAttribute()
    {
        return $this->image ? asset('storage/' . $this->image) : null;
    }
}