<?php

use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    foreach (glob(__DIR__ . '/API/V1/*Route.php') as $partial) {
        require $partial;
    }
});