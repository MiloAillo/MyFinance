<?php

namespace App\Providers;

use App\Http\Helpers\ApiResponseHelper;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $errResponse = fn(string $msg) => fn() => ApiResponseHelper::errorResponse(
            message: $msg,
            statusCode: 429
        );

        RateLimiter::for('api_standard', function (Request $request) use ($errResponse) {
            [$ip, $subnet, $deviceHash] = $this->getClientFingerprint($request);
            $userId = $request->user()?->id;
            
            $res = $errResponse('Too many requests. Please try again later.');

            $limits = [];
            
            if ($userId) {
                $limits[] = Limit::perMinute(60)->by('user:' . $userId)->response($res);
            }

            return array_merge($limits, [
                Limit::perMinute(60)->by('ip:' . $ip)->response($res),
                Limit::perMinute(60)->by('subnet:' . $subnet)->response($res),
                Limit::perMinute(60)->by('device_hash:' . $deviceHash)->response($res),
            ]);
        });

        RateLimiter::for('api_heavy', function (Request $request) use ($errResponse) {
            [$ip, $subnet, $deviceHash] = $this->getClientFingerprint($request);
            $userId = $request->user()?->id;
            
            $res = $errResponse('The server is busy. Please try again later.');

            $limits = [];
            if ($userId) {
                $limits[] = Limit::perMinutes(15, 3)->by('user:' . $userId)->response($res);
            }

            return array_merge($limits, [
                Limit::perMinutes(15, 5)->by('ip:' . $ip)->response($res),
                Limit::perMinutes(15, 5)->by('subnet:' . $subnet)->response($res),
                Limit::perMinutes(15, 5)->by('device_hash:' . $deviceHash)->response($res),
            ]);
        });

        RateLimiter::for('notification_spam', function (Request $request) use ($errResponse) {
            [$ip, $subnet, $deviceHash] = $this->getClientFingerprint($request);
            $userId = $request->user()?->id;
            $email = (string) $request->input('email');
            
            $res = $errResponse('Too many notification requests. Please try again later.');

            $limits = [
                Limit::perMinutes(15, 3)->by('ip:' . $ip)->response($res),
                Limit::perMinute(20)->by('subnet:' . $subnet)->response($res),
                Limit::perMinute(10)->by('device_hash:' . $deviceHash)->response($res),
            ];

            if ($userId) {
                array_unshift($limits, Limit::perMinutes(15, 3)->by('user:' . $userId)->response($res));
            }
            if ($email) {
                array_unshift($limits, Limit::perMinutes(15, 3)->by('email:' . $email)->response($res));
            }

            return $limits;
        });

        RateLimiter::for('register', function (Request $request) use ($errResponse) {
            [$ip, $subnet, $deviceHash] = $this->getClientFingerprint($request);
            $res = $errResponse('Too many registration attempts. Please try again later.');

            return [
                Limit::perMinute(10)->by('ip:' . $ip)->response($res),
                Limit::perMinute(20)->by('subnet:' . $subnet)->response($res),
                Limit::perMinute(10)->by('device_hash:' . $deviceHash)->response($res),
            ];
        });
        
        RateLimiter::for('login', function (Request $request) use ($errResponse) {
            [$ip, $subnet, $deviceHash] = $this->getClientFingerprint($request);
            $email = (string) $request->input('email');
            $res = $errResponse('Too many login attempts. Please try again later.');

            return [
                Limit::perMinute(5)->by('email:' . $email)->response($res),
                Limit::perMinute(10)->by('ip:' . $ip)->response($res),
                Limit::perMinute(20)->by('subnet:' . $subnet)->response($res),
                Limit::perMinute(10)->by('device_hash:' . $deviceHash)->response($res),
            ];
        });

        RateLimiter::for('password_reset_update', function (Request $request) use ($errResponse) {
            [$ip, $subnet, $deviceHash] = $this->getClientFingerprint($request);
            $res = $errResponse('Too many password reset attempts. Please try again later.');

            $limits = [
                Limit::perMinute(10)->by('ip:' . $ip)->response($res),
                Limit::perMinute(20)->by('subnet:' . $subnet)->response($res),
                Limit::perMinute(10)->by('device_hash:' . $deviceHash)->response($res),
            ];

            return $limits;
        });
    }

    private function getClientFingerprint(Request $request): array
    {
        $ip = $request->ip() ?? '127.0.0.1';
        
        // IPv6 vs IPv4 detection for subnetting
        if (str_contains($ip, ':')) {
            // Take the first 4 blocks of IPv6 as a /64 subnet
            $subnet = implode(':', array_slice(explode(':', $ip), 0, 4)) . '::/64';
        } else {
            // Take the /24 subnet for IPv4
            $subnet = preg_replace('/\.\d+$/', '.0/24', $ip);
        }

        $deviceHash = hash('sha256', $ip . $request->userAgent() . $request->header('Accept-Language'));

        return [$ip, $subnet, $deviceHash];
    }
};