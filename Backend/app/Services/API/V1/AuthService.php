<?php

namespace App\Services\API\V1;

use App\Models\User;
use App\Notifications\API\V1\User\Auth\ResetPasswordNotification;
use App\Notifications\API\V1\User\Auth\VerificationEmailNotification;
use App\Notifications\API\V1\User\Auth\Verified\CredentialsChangesNotification;
use App\Notifications\API\V1\User\Auth\Verified\NewDeviceLoginDetectedNotification;
use App\Notifications\API\V1\User\Auth\Verified\VerifiedEmailChangedNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class AuthService
{
    public static function make()
    {
        return new static();
    }

    public function isVerified(User $user): bool
    {
        return $user->email_verified_at ? true : false;
    }

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

    public function updateLastTimeDeviceUsed(User $user, string $deviceHash): void
    {
        $devices = collect($user->known_devices);

        if (!$devices) {
            throw new UnprocessableEntityHttpException('No known devices found.');
        }

        $devices = $devices->map(function ($device) use ($deviceHash) {
            if ($device['hash'] === $deviceHash) {
                $device['last_used_at'] = now();
            }
            return $device;
        });

        $user->known_devices = $devices->sortByDesc('last_used_at')->values()->all();
        $user->save();
    }

    public function makePasswordResetToken(User $user): string
    {
        return Password::broker()->createToken($user);
    }

    public function validatePasswordResetToken(string $email, string $token): bool
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

    public function unsetKnownDevices(User $user): void
    {
        $user->known_devices = null;
        $user->save();
    }

    public function sendNewDeviceLoginDetectedNotification(User $user, string $deviceHash): void
    {
        $user->notify(new NewDeviceLoginDetectedNotification($deviceHash));
    }

    public function sendResetPasswordNotification(User $user, string $token): void
    {
        $user->notify(new ResetPasswordNotification($token));
    }

    public function sendCredentialsChangesNotification(User $user, string $fields): void
    {
        $user->notify(new CredentialsChangesNotification($fields));
    }

    public function sendVerifiedEmailChangedNotification(User $user, string $newEmail): void
    {
        $user->notify(new VerifiedEmailChangedNotification($newEmail));
    }

    public function sendVerificationEmailNotification(User $user): void
    {
        $user->notify(new VerificationEmailNotification());
    }
}
