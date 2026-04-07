<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TrackerController;

    Route::apiResource('trackers', TrackerController::class)->middleware('throttle:api');
