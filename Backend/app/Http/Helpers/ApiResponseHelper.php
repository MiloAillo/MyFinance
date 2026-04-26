<?php

namespace App\Http\Helpers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\JsonApi\AnonymousResourceCollection;
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
            $normalized = $data;

            if ($data instanceof AnonymousResourceCollection || $data instanceof JsonResponse) {
                if ($data instanceof AnonymousResourceCollection) {
                    $normalized = $data->response()->getData(true);

                } else {
                    $normalized = $data->getData(true);
                }
                
            } else if (is_object($data) && method_exists($data, 'resolve')) {
                $normalized = $data->resolve();

            } else if (is_object($data) && method_exists($data, 'toArray')) {
                $normalized = $data->toArray();
            }

            if (is_array($normalized) && array_key_exists('data', $normalized)) {
                $response['data'] = $normalized['data'];

                foreach (['meta', 'links'] as $key) {
                    if (array_key_exists($key, $normalized)) {
                        $response[$key] = $normalized[$key];
                    }
                }
                
            } else {
                $response['data'] = $normalized;
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