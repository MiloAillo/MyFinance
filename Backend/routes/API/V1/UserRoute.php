<?php

use App\Http\Controllers\API\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::controller(UserController::class)->group(function () {

    // Authentication Routes
    Route::post('users', 'store')->middleware('throttle:register')->name('auth.register');

    Route::prefix('auth')->name('auth.')->group(function () {
        Route::prefix('tokens')->group(function () {
            Route::post('/', 'login')->middleware('throttle:login')->name('login');
            Route::get('new-device/{key}', 'login')->middleware('signed')->name('login.new-device');
        });
        
        Route::prefix('password-resets')->middleware('signed')->name('password-resets.')->group(function () {
            Route::post('/', 'forgotPassword')->middleware('throttle:notification_spam')->withoutMiddleware('signed')->name('email');
            Route::get('/{credentials}', 'validateResetToken')->name('validate');
            Route::put('/{credentials}', 'resetPassword')->middleware('throttle:password_reset_update')->name('update');
        });

        Route::delete('tokens/current', 'logout')->name('logout')->middleware('auth:sanctum');

        // Email Verification Routes
        Route::prefix('email')->name('email.')->group(function () {
            Route::post('send', 'sendVerificationEmail')->middleware(['auth:sanctum', 'throttle:notification_spam'])->name('send');
            Route::get('verify/{key}', 'verifyEmail')->middleware('signed')->name('verify');
        });
    });

    // User Management Routes
    Route::prefix('users/profile')->name('users.')->middleware('auth:sanctum')->group(function () {
        Route::get('/', 'show')->name('show');
        Route::patch('/', 'update')->name('update');
        Route::get('/verify-new-email/{key}', 'update')->withoutMiddleware('auth:sanctum')->middleware('signed')->name('update.verify.new-email'); // For email change verification
        Route::delete('/', 'destroy')->name('destroy');
    });
});