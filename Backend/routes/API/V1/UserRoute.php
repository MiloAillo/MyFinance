<?php

use App\Http\Controllers\AvatarController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('user')->group(function () {
    Route::get('/profile', [ProfileController::class, 'get'])->middleware('throttle:api')->name('profile-fetch');
    Route::patch('/profile', [ProfileController::class, 'patch'])->middleware('throttle:api')->name('profile-update');
    Route::put('/avatar', [AvatarController::class, 'update'])->middleware('throttle:api')->name('profile-avatar-update');
    Route::delete('/avatar', [AvatarController::class, 'delete'])->middleware('throttle:api')->name('profile-avatar-delete');
});