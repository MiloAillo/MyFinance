<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('forgot-password');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('reset-password');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    });

    Route::apiResource('trackers', TrackerController::class);
    Route::apiResource('transactions', TransactionController::class);

    Route::get('search/trackers', [TrackerController::class, 'search']);
    Route::get('search/transactions', [TransactionController::class, 'search']);
});

Route::fallback(function () {
    return response()->json([
        'response_code' => 404,
        'status' => 'error',
        'message' => 'API endpoint not found'
    ], 404);
});