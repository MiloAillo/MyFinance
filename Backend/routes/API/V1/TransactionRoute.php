<?php

use App\Http\Controllers\TrackerController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::apiResource('trackers/{tracker}/transactions', TransactionController::class)->middleware('throttle:api');
Route::get('trackers/{tracker}/paginate/transactions', [TransactionController::class, 'paginate'])->middleware('throttle:api')->name('transactions-paginate');
Route::get('trackers/{tracker}/transactions', [TransactionController::class, 'show'])->middleware('throttle:api')->name('transactions-search-by-domain');
Route::get('trackers/{tracker}/range/transactions', [TransactionController::class, 'ranged'])->middleware('throttle:api')->name('transactions-range');
Route::get('trackers/{tracker}/all/transactions', [TrackerController::class, 'allTransactions'])->middleware('throttle:api')->name('transactions-all');