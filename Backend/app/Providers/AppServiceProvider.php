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
        // Authentication Attempts
        RateLimiter::for('auth_strict', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip())->response(fn() =>
                ApiResponseHelper::errorResponse(
                    message: 'Too many attempts. Please try again later.',
                    statusCode: 429
                )
            );
        });

        // Notification Spam
        RateLimiter::for('notification_spam', function (Request $request) {
            return Limit::perMinutes(15, 3)->by($request->ip())->response(fn() =>
                ApiResponseHelper::errorResponse(
                    message: 'Too many notification requests. Please try again later.',
                    statusCode: 429
                )
            );
        });

        // Heavy Operations (Report & Bulk Data)
        RateLimiter::for('api_heavy', function (Request $request) {
            $key = $request->user()?->id ?? $request->ip();
            return Limit::perMinute(20)->by($key)->response(fn() =>
                ApiResponseHelper::errorResponse(
                    message: 'The server is currently busy. Please try again later.',
                    statusCode: 429
                )
            );
        });

        // API Standard (Normal CRUD)
        RateLimiter::for('api_standard', function (Request $request) {
            $key = $request->user()?->id ?? $request->ip();
            return Limit::perMinute(60)->by($key)->response(fn() =>
                ApiResponseHelper::errorResponse(
                    message: 'Too many attempts. Please try again later.',
                    statusCode: 429
                )
            );
        });
    }
};