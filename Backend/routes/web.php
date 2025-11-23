<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'This is a pure API service. Use API endpoints.',
        // 'documentation' => '/api/documentation'
    ]);
});