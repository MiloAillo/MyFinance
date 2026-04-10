<?php

use App\Http\Controllers\API\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::controller(UserController::class)->group(function () {

    // Authentication Routes
    Route::post('users', 'store')->name('auth.register');

    Route::prefix('auth')->group(function () {
        Route::post('tokens', 'login')->name('auth.login');
        Route::post('password-resets', 'forgotPassword')->name('auth.password-resets.email');
        Route::get('password-resets', 'validateResetToken')->name('auth.password-resets.validate');
        Route::put('password-resets', 'resetPassword')->name('auth.password-resets.update');
        Route::delete('tokens/current', 'logout')->name('auth.logout')->middleware('auth:sanctum');
    });

    // User Management Routes
    Route::prefix('users/profile')->middleware('auth:sanctum')->group(function () {
        Route::get('/', 'show')->name('users.show');
        Route::patch('/', 'update')->name('users.update');
        Route::delete('/', 'destroy')->name('users.destroy');
        Route::patch('/avatar', 'handleAvatar')->name('users.avatar');
    });
});