<?php

namespace App\Exceptions;

use App\Http\Helpers\ApiResponseHelper;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class ApiExceptionHandler
{
    public static function handle(Throwable $e): JsonResponse
    {
        $statusCode = self::getStatusCode($e);
        $message = self::getExceptionMessage($e, $statusCode);
        $errors = self::getErrors($e);
        // dd($statusCode);

        return ApiResponseHelper::errorResponse(
                message: $message,
                statusCode: $statusCode,
                errors: $errors,
                exception: $e
            );
    }

    public static function getExceptionMessage(Throwable $e, int $statusCode): string
    {
        return match (true) {
            $e instanceof ModelNotFoundException => 'Resource not found',
            $e instanceof ValidationException => 'Validation failed',
            $e instanceof ThrottleRequestsException => 'Too many requests. Please try again later.',
            $statusCode >= 500 => config('app.debug') ? $e->getMessage() : 'Server error',
            default => $e->getMessage() ?: 'An error occurred'
        };
    }

    public static function getStatusCode(Throwable $e): int
    {
        return match (true) {
            $e instanceof HttpExceptionInterface => $e->getStatusCode(),
            property_exists($e, 'status') => $e->status,
            method_exists($e, 'getCode') && !is_string($e->getCode()) &&
            100 <= $e->getCode() && $e->getCode() < 600 => $e->getCode(),
            default => 500
        };
    }

    public static function getErrors(Throwable $e): array|null
    {
        return match (true) {
            method_exists($e, 'errors') => $e->errors(),
            method_exists($e, 'getErrors') => $e->getErrors(), // Custom method for other exception types
            default => null
        };
    }
}
