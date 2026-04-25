<?php

namespace App\Http\Helpers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class ApiResponseHelper
{
    // success responses
    public static function successResponse(
        $data = null,
        string $message = 'Success',
        string $status = 'SUCCESS',
        int $statusCode = Response::HTTP_OK,
    ): JsonResponse {

        $response = [
            'status_code' => $statusCode,
            'status' => $status,
            'message' => $message,
        ];

        if (config('app.debug')) {
            $response['timestamp'] = now()->toISOString();
        }

        if (!empty($data)) {
            if (method_exists($data, 'resolve')) {
                $resolved = $data->resolve();

                if (is_array($resolved) && array_key_exists('data', $resolved)) {
                    $response = array_merge_recursive($response, $resolved);
                } else {
                    $response['data'] = $resolved;
                }

            } else if (method_exists($data, 'toArray')) {
                $arrayData = $data->toArray();

                if (is_array($arrayData['data']) && array_key_exists('data', $arrayData)) {
                    $response = array_merge_recursive($response, $arrayData);
                } else {
                    $response['data'] = $arrayData['data'];
                }
                
            } else {
                $response['data'] = $data;
            }
        }
        
        return response()->json($response, $statusCode);
    }

    public static function errorResponse(
        string $message = 'Error',
        string $status = 'ERROR',
        int $statusCode = Response::HTTP_BAD_REQUEST,
        $errors = null,
        array $extra = [],
        ?\Throwable $exception = null
    ): JsonResponse {

        $response = [
            'status_code' => $statusCode,
            'status' => $status,
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