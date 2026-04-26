<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'pending_email',
        'known_devices',
    ];

    protected function casts(): array
    {
        return [
            'known_devices' => 'collection',
        ];
    }

    public function trackers()
    {
        return $this->hasMany(Tracker::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function getAvatarUrlAttribute()
    {
        if ($this->avatar) {
            return Storage::disk('public')->url("users/avatars/{$this->avatar}");
        }

        return null;
    }
}
