<?php

namespace App\Exceptions;

use App\Helpers\ResponseHelper;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        ValidationException::class // Dont report validation errors
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $exception): JsonResponse
    {
        // Handle API exceptions with JSON response
        if ($request->is('api/*') || $request->expectsJson()) {
            $statusCode = $this->getStatusCode($exception);

            $extra = [];
            if (config('app.debug')) {
                $extra['debug'] = [
                    'type' => get_class($exception),
                    'message' => $exception->getMessage(),
                    'trace' => collect($exception->getTrace())->take(5),
                ];
            }

            return ResponseHelper::errorResponse(
                message: $this->getExceptionMessage($exception, $statusCode),
                statusCode: $statusCode,
                errors: $exception instanceof ValidationException ? $exception->errors() : null,
                extra: $extra,
            );
        }

        return parent::render($request, $exception);
    }

    /**
     * Get the appropriate status code for the exception.
     */
    private function getStatusCode(Throwable $exception): int
    {
        return match (true) {
            $exception instanceof AuthenticationException => 401,
            $exception instanceof ModelNotFoundException => 404,
            $exception instanceof NotFoundHttpException => 404,
            $exception instanceof MethodNotAllowedHttpException => 405,
            $exception instanceof ValidationException => 422,
            default => 500
        };
    }

    /**
     * Get the exception message based on status code.
     */
    private function getExceptionMessage(Throwable $exception, int $statusCode): string
    {
        return match (true) {
            $exception instanceof AuthenticationException => 'Unauthorized.',
            $exception instanceof ValidationException => 'Validation failed.',
            $exception instanceof ModelNotFoundException => 'Resource not found.',
            $exception instanceof NotFoundHttpException => 'Endpoint not found.',
            $exception instanceof MethodNotAllowedHttpException => 'Method not allowed.',
            $statusCode === 500 => 'Internal server error occurred.',
            default => $exception->getMessage() ?: 'An error occurred.'
        };
    }
}