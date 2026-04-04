<?php

use App\Http\Helpers\ResponseHelper;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        using: function () {
            Route::middleware('web')->group(base_path('routes/web.php'));

            $apiPath = base_path('routes/API');

            foreach (glob("$apiPath/V*/EntryPoint.php") as $file) {
                $versionPrefix = strtolower(basename(dirname($file)));
                Route::middleware('api')->prefix("api/$versionPrefix")->group($file);
            }

            Route::fallback(function () {
                return response()->json([
                    'response_code' => 404,
                    'status' => 'error',
                    'message' => 'API endpoint not found'
                ], 404);
            });
        },

        commands: __DIR__.'/../routes/console.php',
        health: '/api/up',
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
            
            if ($e instanceof ValidationException) {
                return ResponseHelper::errorResponse(
                    message:'Validation failed',
                    statusCode: Response::HTTP_UNPROCESSABLE_ENTITY,
                    errors: $e->errors(),
                    extra: [],
                    exception: $e
                );
            }
            if ($e instanceof HttpException) {
                return ResponseHelper::errorResponse(
                    message: $e->getMessage() ?: 'Unauthorized access or page not found',
                    statusCode: $e->getStatusCode(),
                    errors: [],
                    extra: [],
                    exception: $e
                );
            }
            return ResponseHelper::internalServerErrorResponse(
                exception: $e,
                context: 'Internal Server Error',
            );
        });
    })
    ->create();
