<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TrackerController;

Route::controller(TrackerController::class)->group(function () {
    Route::apiResource('trackers', TrackerController::class);
});
