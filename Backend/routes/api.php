<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/register', [AuthController::class, 'register'])->name('register');
});

Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    // Route::get('/user', [AuthController::class, 'user'])->name('user');
});

Route::fallback(function () {
    return response()->json([
        'response_code' => 404,
        'status' => 'error',
        'message' => 'API endpoint not found'
    ], 404);
});