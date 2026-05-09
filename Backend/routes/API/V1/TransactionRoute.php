<?php

use App\Http\Controllers\API\V1\TransactionController;
use Illuminate\Support\Facades\Route;

Route::controller(TransactionController::class)->middleware('auth:sanctum')->group(function () {

    Route::apiResource('transactions', TransactionController::class)->only(['show', 'update']);
    Route::prefix('trackers/{tracker}/transactions')->name('transactions')->group(function () {
        Route::post('', 'store')->name('.store');
        Route::get('', 'index')->name('.index');
    });
    Route::delete('transactions/{transaction}', 'delete')->name('transactions.delete');

    Route::apiResource('deleted/transactions', TransactionController::class)->withTrashed()->only(['index', 'show'])->names([
        'index' => 'deleted.transactions.index',
        'show' => 'deleted.transactions.show',
    ]);
    
    Route::prefix('deleted/transactions/{transaction}')->name('deleted.transactions')->group(function () {
        Route::patch('/restore', 'restore')->withTrashed()->name('.restore');
        Route::delete('/force', 'forceDelete')->withTrashed()->name('.force');
    });
    
});