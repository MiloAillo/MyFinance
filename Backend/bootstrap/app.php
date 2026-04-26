<?php

use App\Http\Helpers\ApiResponseHelper;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__.'/../routes/console.php',
        using: function () {
            // Route::middleware('web')->group(base_path('routes/web.php'));
            Route::middleware('api')->prefix('api')->group(base_path('routes/api.php'));
            
            Route::fallback(function () {
                return ApiResponseHelper::errorResponse(
                    message: 'Endpoint not found.',
                    statusCode: 404
                );
            });
        }
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            \App\Http\Middleware\ForceJsonResponse::class,
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        $middleware->api(append: [
            'throttle:api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e) {
            return true;
        })
        ->render(function (Throwable $e, Request $request) {
            return App\Exceptions\API\ApiExceptionHandler::handle($e);
        })
        ->dontReport([
            Illuminate\Http\Exceptions\ThrottleRequestsException::class,
        ])
        ->report(function (Throwable $e) {
            if ($e instanceof \PDOException) {
                $caption = '[Internal Server Error] ' . get_class($e) . ' : '. $e->getMessage();

                $details = [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ];

                Log::error($caption, $details);
            }
        });
    })
    ->create();
