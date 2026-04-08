<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::controller(UserController::class)->group(function () {
    // Authentication Routes
    Route::prefix('auth')->group(function () {
        Route::post('tokens', 'login')->name('auth.login');
        Route::post('password-resets', 'forgotPassword')->name('auth.password-resets.email');
        Route::put('password-resets', 'resetPassword')->name('auth.password-resets.update');
        Route::delete('tokens/current', 'logout')->name('auth.logout');
    });

    // User Management Routes
    Route::prefix('users')->group(function () {
        Route::post('/', 'store')->name('auth.register');

        Route::prefix('profile')->group(function () {
            Route::get('/', 'show')->name('users.show');
            Route::patch('/', 'update')->name('users.update');
            Route::delete('/', 'destroy')->name('users.destroy');
        });

        Route::patch('profile/avatar', 'handleAvatar')->name('users.avatar');
    });
});

// Route::prefix('auth')->group(function () {
//     Route::post('tokens', 'login')->name('auth.login');
//     Route::post('password-resets', 'forgotPassword')->name('auth.password-resets.email');
//     Route::put('password-resets', 'resetPassword')->name('auth.password-resets.update');
//     Route::delete('tokens/current', 'logout')->name('auth.logout');
// });

// Route::apiResource('users', UserController::class)->only(['store', 'show', 'update', 'destroy'])->names([
//     'store' => 'auth.register',
//     'show' => 'users.show',
//     'update' => 'users.update',
//     'destroy' => 'users.destroy',
// ]);

// Route::prefix('users')->middleware('auth:sanctum')->group(function () {
//     Route::post('/', [UserController::class, 'store'])->name('auth.register');
//     Route::get('/profile', [UserController::class, 'show'])->name('users.show');
//     Route::patch('/profile', [UserController::class, 'update'])->name('users.update');
//     Route::delete('/profile', [UserController::class, 'destroy'])->name('users.destroy');
//     Route::patch('/avatar', [UserController::class, 'handleAvatar'])->name('users.avatar');
// });

// Route::post('users', [UserController::class, 'store'])->name('auth.register');

// Route::apiSingleton('profile', UserController::class)->only(['show', 'update', 'destroy'])->names([
//     'show' => 'users.show',
//     'update' => 'users.update',
//     'destroy' => 'users.destroy',
// ]);

// Route::patch('profile/avatar', [UserController::class, 'handleAvatar'])->name('users.avatar');