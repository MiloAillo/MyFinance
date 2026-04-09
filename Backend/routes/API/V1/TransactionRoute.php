<?php

use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::controller(TransactionController::class)->group(function () {
    Route::prefix('trackers/{tracker}/transactions')->group(function () {
        Route::post('', 'store');
        Route::get('', 'index');
    });
    Route::apiResource('transactions', TransactionController::class)->except(['index', 'store']);
});