<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

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
        'files',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'files' => 'collection',
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

    public function scopeStartsBefore(Builder $query, $date)
    {
        return $query->where('date', '<=',Carbon::parse($date));
    }

    public function scopeInBetween(Builder $query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [Carbon::parse($startDate), Carbon::parse($endDate)]);
    }

    public function scopeEndsAfter(Builder $query, $date)
    {
        return $query->where('date', '>=', Carbon::parse($date));
    }

    public function getFileUrlAttribute()
    {
        if ($this->files->isNotEmpty()) {
            return $this->files->map(fn ($file) => Storage::disk('public')->url("transactions/{$this->id}/files/{$file}"));
        }

        return null;
    }
}