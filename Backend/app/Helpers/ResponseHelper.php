<?php

namespace App\Helpers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class ResponseHelper
{
    // Standard success JSON response
    public static function successResponse( $data = null,
                                            string $message = 'Success',
                                            int $statusCode = Response::HTTP_OK):JsonResponse
    {
        $response = [
            'response_code' => $statusCode,
            'status' => 'success',
            'message' => $message,
            'timestamp' => now()->toISOString(),
        ];

        if (!is_null($data)) {
            $response['data'] = $data;
        }

        return response()->json($response, $statusCode);
    }

    // Standard error JSON response
    public static function errorResponse(
        string $message = 'Error',
        int $statusCode = Response::HTTP_BAD_REQUEST,
        $errors = null,
        array $extra = []
    ): JsonResponse {
        $payload = [
            'response_code' => $statusCode,
            'status' => 'error',
            'message' => $message,
            'timestamp' => now()->toISOString(),
        ];

        if (!is_null($errors)) {
            $payload['errors'] = $errors;
        }

        if (!empty($extra)) {
            $payload = array_merge($payload, $extra);
        }

        return response()->json($payload, $statusCode);
    }

    // Standard validation error JSON response
    public static function validationErrorResponse($validator):JsonResponse
    {
        return self::errorResponse(
            'Validation failed',
            Response::HTTP_UNPROCESSABLE_ENTITY,
            $validator->errors()->toArray()
        );
    }

    // Resource created JSON response
    public static function createdResponse($data = null,
                                           string $message = 'Resource created successfully'):JsonResponse
    {
        return self::successResponse($data, $message, Response::HTTP_CREATED);
    }

    // Resource updated JSON response
    public static function updatedResponse($data = null,
                                           string $message = 'Resource updated successfully'):JsonResponse
    {
        return self::successResponse($data, $message, Response::HTTP_OK);
    }

    // Resource deleted JSON response
    public static function deletedResponse(string $message = 'Resource deleted successfully'):JsonResponse
    {
        return self::successResponse(null, $message, Response::HTTP_OK);
    }

    // Not found JSON response
    public static function notFoundResponse(string $message = 'Resource not found'):JsonResponse
    {
        return self::errorResponse($message, Response::HTTP_NOT_FOUND);
    }

    // Not authorized JSON response
    public static function unauthorizedResponse(string $message = 'Unauthorized access'):JsonResponse
    {
        return self::errorResponse($message, Response::HTTP_UNAUTHORIZED);
    }

    // Forbidden JSON response
    public static function forbiddenResponse(string $message = 'Forbidden access'):JsonResponse
    {
        return self::errorResponse($message, Response::HTTP_FORBIDDEN);
    }

    // Log error and return internal server error response
    public static function logAndErrorResponse(\Exception $e,
                                                string $context,
                                                string $message = 'An error occurred'):JsonResponse
    {
        Log::error("{$context}: {$e->getMessage()}", [
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);

        return self::errorResponse(
            config('app.debug') ? $e->getMessage() : $message,
            Response::HTTP_INTERNAL_SERVER_ERROR
        );
    }
}