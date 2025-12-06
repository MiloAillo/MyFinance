<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\TrackerController;
use App\Http\Controllers\API\TransactionController;
use App\Http\Controllers\API\AvatarController;
use App\Http\Controllers\API\ProfileController;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:api')->name('register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login')->name('login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:forgot-password')->name('forgot-password');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:reset-password')->name('reset-password');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->middleware('throttle:api')->name('logout');
    });

    Route::apiResource('trackers', TrackerController::class)->middleware('throttle:api');
    Route::apiResource('trackers/{tracker}/transactions', TransactionController::class)->middleware('throttle:api');
    Route::get('trackers/{tracker}/paginate/transactions', [TransactionController::class, 'paginate'])->middleware('throttle:api')->name('transactions-paginate');
    Route::get('trackers/{tracker}/transactions', [TransactionController::class, 'show'])->middleware('throttle:api')->name('transactions-search-by-domain');
    Route::get('trackers/{tracker}/range/transactions', [TransactionController::class, 'ranged'])->middleware('throttle:api')->name('transactions-range');

    Route::prefix('search')->group(function () {
        Route::get('/trackers', [TrackerController::class, 'search'])->middleware('throttle:api')->name('trackers-search');
        Route::get('/transactions', [TransactionController::class, 'search'])->middleware('throttle:api')->name('transactions-search');
    });

    Route::prefix('user')->group(function () {
        Route::get('/profile', [ProfileController::class, 'get'])->middleware('throttle:api')->name('profile-fetch');
        Route::patch('/profile', [ProfileController::class, 'patch'])->middleware('throttle:api')->name('profile-update');
        Route::put('/avatar', [AvatarController::class, 'update'])->middleware('throttle:api')->name('profile-avatar-update');
        Route::delete('/avatar', [AvatarController::class, 'delete'])->middleware('throttle:api')->name('profile-avatar-delete');
    });
});

Route::fallback(function () {
    return response()->json([
        'response_code' => 404,
        'status' => 'error',
        'message' => 'API endpoint not found'
    ], 404);
});