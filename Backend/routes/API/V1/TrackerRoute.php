<?php

use App\Http\Controllers\API\V1\TrackerController;
use Illuminate\Support\Facades\Route;

Route::controller(TrackerController::class)->middleware('auth:sanctum')->group(function () {
    Route::apiResource('trackers', TrackerController::class)->except(['destroy']);
    Route::delete('trackers/{tracker}', [TrackerController::class, 'destroy'])->withTrashed()->name('trackers.destroy');
    Route::patch('trackers/{tracker}/restore', [TrackerController::class, 'restore'])->withTrashed()->name('trackers.restore');
});
