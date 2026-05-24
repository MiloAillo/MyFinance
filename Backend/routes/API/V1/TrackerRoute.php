<?php

use App\Http\Controllers\API\V1\TrackerController;
use Illuminate\Support\Facades\Route;

Route::controller(TrackerController::class)->middleware('auth:sanctum')->group(function () {

    Route::apiResource('trackers', TrackerController::class)->except(['destroy']);
    Route::prefix('trackers/{tracker}')->name('trackers.')->group(function () {
        Route::delete('/', 'delete')->name('delete');
        Route::get('/reports', 'reports')->name('reports');
    });
    
    Route::prefix('deleted/trackers')->name('deleted.trackers')->group(function () {
        Route::get('/', 'indexDeleted')->withTrashed()->name('.index');
        Route::prefix('/{tracker}')->group(function () {
            Route::get('/', 'showDeleted')->withTrashed()->name('.show');
            Route::patch('/restore', 'restore')->withTrashed()->name('.restore');
            Route::delete('/force', 'forceDelete')->withTrashed()->name('.force');
        });
    });
    
});
