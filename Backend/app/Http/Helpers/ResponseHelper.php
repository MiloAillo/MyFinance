<?php

namespace App\Http\Helpers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class ResponseHelper
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

        if (!empty($data)) {
            $response['data'] = $data;
        }

        return response()->json($response, $statusCode);
    }


    // public static function validationErrorResponse($validator):JsonResponse
    // {
    //     return self::errorResponse(
    //         'Validation failed',
    //         Response::HTTP_UNPROCESSABLE_ENTITY,
    //         $validator->errors()->toArray()
    //     );
    // }

    // public static function createdResponse(
    //     $data = null,
    //     string $message = 'Resource created successfully.'
    // ): JsonResponse {
    //     return self::successResponse($data, $message, Response::HTTP_CREATED);
    // }

    // public static function updatedResponse(
    //     $data = null,
    //     string $message = 'Resource updated successfully.'
    // ): JsonResponse {
    //     return self::successResponse($data, $message, Response::HTTP_OK);
    // }

    // public static function deletedResponse(
    //     string $message = 'Resource deleted successfully.'
    // ): JsonResponse {
    //     return self::successResponse(null, $message, Response::HTTP_OK);
    // }

    // public static function notFoundResponse(
    //     string $message = 'Resource not found.'
    // ): JsonResponse {
    //     return self::errorResponse($message, Response::HTTP_NOT_FOUND);
    // }

    // public static function unauthorizedResponse(
    //     string $message = 'Unauthorized access.'
    // ): JsonResponse {
    //     return self::errorResponse($message, Response::HTTP_UNAUTHORIZED);
    // }

    // public static function forbiddenResponse(
    //     string $message = 'Forbidden access.'
    // ): JsonResponse {
    //     return self::errorResponse($message, Response::HTTP_FORBIDDEN);
    // }

    public static function internalServerErrorResponse(
        \Exception $exception,
        string $context,
        string $message = 'An error occurred.',
    ): JsonResponse {
        
        $caption = "{$context}: {$exception->getMessage()}";

        $details = [
            'exception' => get_class($exception),
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString()
        ];

        Log::error($caption, $details);

        return self::errorResponse(
            config('app.debug') ? $exception->getMessage() : $message,
            Response::HTTP_INTERNAL_SERVER_ERROR,
            null,
            [],
            $exception
        );
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