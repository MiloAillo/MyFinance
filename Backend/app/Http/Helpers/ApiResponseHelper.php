<?php

namespace App\Http\Helpers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class ApiResponseHelper
{
    // success responses
    public static function successResponse(
        $data = null,
        string $message = 'Success',
        int $statusCode = Response::HTTP_OK
    ): JsonResponse {

        $response = [
            'status_code' => $statusCode,
            'status' => 'Success',
            'message' => $message,
        ];

        if (config('app.debug')) {
            $response['timestamp'] = now()->toISOString();
        }

        if (!empty($data) && method_exists($data, 'resolve')) {
            $response += $data->resolve();
        }

        return response()->json($response, $statusCode);
    }

    public static function errorResponse(
        string $message = 'Error',
        int $statusCode = Response::HTTP_BAD_REQUEST,
        $errors = null,
        array $extra = [],
        \Throwable $exception = null
    ): JsonResponse {

        $response = [
            'status_code' => $statusCode,
            'status' => 'Error',
            'message' => $message,
        ];

        if (config('app.debug')) {
            $response['timestamp'] = now()->toISOString();
        }

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        if (!empty($extra)) {
            $response = array_merge($response, $extra);
        }

        if (config('app.debug') && !empty($exception)) {
                $response['debug'] = [
                    'exception' => get_class($exception),
                    'file' => $exception->getFile(),
                    'line' => $exception->getLine(),
                    'trace' => $exception->getTraceAsString()
                ];
        }
        
        return response()->json($response, $statusCode);
    }
}