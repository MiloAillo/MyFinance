<?php

namespace App\Services\API\V1;

use App\Models\User;
use App\Notifications\API\V1\User\Auth\ResetPasswordNotification;
use App\Notifications\API\V1\User\Auth\VerificationEmailNotification;
use App\Notifications\API\V1\User\Auth\Verified\CredentialsChangesNotification;
use App\Notifications\API\V1\User\Auth\Verified\NewDeviceLoginDetectedNotification;
use App\Notifications\API\V1\User\Auth\Verified\VerifiedEmailChangedNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthService
{
    public static function make()
    {
        return new static();
    }

    // Password Reset
    public function makePasswordResetToken(User $user): string
    {
        return Password::broker()->createToken($user);
    }

    public function encryptPasswordResetToken(string $email, string $token): string
    {
        $data = ['email' => $email, 'token' => $token];
        return Crypt::encrypt($data);
    }

    public function decryptPasswordResetToken(string $encryptedData): array
    {
        try {

            $decrypted = Crypt::decrypt($encryptedData);

        } catch (\Exception $e) {
            return [];
        }

        return $decrypted;
    }

    public function isPasswordResetTokenValid(string $email, string $token): bool
    {
        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if ($record &&
            Hash::check($token, $record->token) &&
            !Carbon::parse($record->created_at)->addMinutes(config('auth.passwords.users.expire'))->isPast()){
            return true;

        } else {
            return false;
        }
    }

    public function updatePassword(array $credentials): void
    {
        Password::broker()->reset(
            $credentials, function (User $user, string $password) {
            $user->forceFill([
                'password' => Hash::make($password)
            ])->save();
        });
    }

    // Cache Management
    public function encryptAndCacheData(string $keyType, mixed $value, int $minutes): string
    {
        $id = (string) Str::ulid();
        $key = "{$keyType}_{$id}";
        $value = Crypt::encrypt($value);

        Cache::put($key, $value, now()->addMinutes($minutes));

        return $id;
    }

    public function retrieveEncryptedCachedData(string $keyType, string $key): mixed
    {
        $cacheKey = "{$keyType}_{$key}";
        $encryptedValue = Cache::pull($cacheKey);

        if (!$encryptedValue) {
            return null;
        }

        try {

            return Crypt::decrypt($encryptedValue);

        } catch (\Exception $e) {
            return null;
        }
    }

    // Device Management
    public function hashDevice($userId, string $userAgent): string
    {
        return hash('sha256', "$userId|$userAgent");
    }

    public function addDevice(User $user, string $deviceHash): void
    {
        $devices = collect($user->known_devices);
        $maxDevices = config('auth.users.known_devices_limit');

        $devices = $devices->push([
                        "hash" => $deviceHash,
                        "last_used_at" => now(),
                    ]);

        $user->known_devices = $devices->sortByDesc('last_used_at')->take($maxDevices)->values();
        $user->save();
    }

    public function isDeviceKnown(User $user, string $deviceHash): bool
    {
        $devices = collect($user->known_devices);

        return $devices->contains(fn($device) => $device['hash'] === $deviceHash);
    }

    public function updateLastTimeDeviceUsed(User $user, string $deviceHash): void
    {
        $devices = collect($user->known_devices);

        $devices = $devices->map(function ($device) use ($deviceHash) {
            if ($device['hash'] === $deviceHash) {
                $device['last_used_at'] = now();
            }
            return $device;
        });

        $user->known_devices = $devices->sortByDesc('last_used_at')->values();
        $user->save();
    }

    public function unsetKnownDevicesExceptCurrent(User $user, string $userAgent): void
    {
        $devices = collect($user->known_devices);
        $currentDeviceHash = $this->hashDevice($user->id, $userAgent);

        $devices = $devices->filter(fn($device) => $device['hash'] === $currentDeviceHash);

        $user->known_devices = $devices->values();
        $user->save();
    }

    public function unsetKnownDevices(User $user): void
    {
        $user->known_devices = null;
        $user->save();
    }

    // Notifications
    public function sendNewDeviceLoginDetectedNotification(User $user, string $key, ?int $expiresInMinutes = null): void
    {
        $expiresInMinutes = $expiresInMinutes ?? config('auth.new_device_login.expire');
        $user->notify(new NewDeviceLoginDetectedNotification($key, $expiresInMinutes));
    }

    public function sendResetPasswordNotification(string $email, string $credentials, ?int $expiresInMinutes = null): void
    {
        $expiresInMinutes = $expiresInMinutes ?? config('auth.passwords.users.expire');
        Notification::route('mail', $email)->notify(new ResetPasswordNotification($credentials, $expiresInMinutes));
    }

    public function sendVerificationEmailNotification(User $user, string $key, ?int $expiresInMinutes = null): void
    {
        $expiresInMinutes = $expiresInMinutes ?? config('auth.verification.expire');
        $user->notify(new VerificationEmailNotification($key, $expiresInMinutes));
    }

    public function sendVerifiedEmailChangedNotification(string $email, string $key, ?int $expiresInMinutes = null): void
    {
        $expiresInMinutes = $expiresInMinutes ?? config('auth.verification.expire');
        Notification::route('mail', $email)->notify(new VerifiedEmailChangedNotification($key, $expiresInMinutes));
    }

    public function sendCredentialsChangesNotification(string $email, string $fields): void
    {
        Notification::route('mail', $email)->notify(new CredentialsChangesNotification($fields));
    }
}
