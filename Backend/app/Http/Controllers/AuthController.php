<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(RegisterRequest $request)
    {
        try {
            $validated = $request->validated();

            $user = User::create([
                'name' => $validated['name'],
                'email'    => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            $token = $user->createToken('authToken')->plainTextToken;

            return $this->authResponse('user successfully registered', $user, $token, Response::HTTP_CREATED);

        } catch (\Exception $e) {
            // Log::error('registration error : ' . $e->getMessage());

            // return response()->json([
            //     'response_code' => Response::HTTP_INTERNAL_SERVER_ERROR,
            //     'status' => 'error',
            //     'message' => 'registration failed',
            // ], Response::HTTP_INTERNAL_SERVER_ERROR);

            return $this->execptionResponse($e, 'registration error', 'registration failed');
        }
    }

    /**
     * Login the user
     */
    public function login(LoginRequest $request)
    {
        try {
            $credentials = $request->validated();

            if (!Auth::attempt($credentials)) {
                return response()->json([
                    'response_code' => Response::HTTP_UNAUTHORIZED,
                    'status' => 'error',
                    'message' => 'invalid credentials',
                ], Response::HTTP_UNAUTHORIZED);
            }

            $user = Auth::user();

            $token = $user->createToken('authToken')->plainTextToken;

            return $this->authResponse('login successful', $user,  $token);

        } catch (\Exception $e) {
            // Log::error('login error : ' . $e->getMessage());

            // return response()->json([
            //     'response_code' => Response::HTTP_INTERNAL_SERVER_ERROR,
            //     'status' => 'error',
            //     'message' => 'login failed',
            // ], Response::HTTP_INTERNAL_SERVER_ERROR);
            
            return $this->execptionResponse($e, 'login error', 'login failed');
        }
    }

    /**
     * Logout the authenticated user
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'response_code' => Response::HTTP_UNAUTHORIZED,
                    'status' => 'error',
                    'message' => 'user not authenticated'
                ], Response::HTTP_UNAUTHORIZED);
            }

            $user->currentAccessToken()->delete();

            return $this->authResponse('user successfully logged out');

        } catch (\Exception $e) {
            // Log::error('logout error : ' . $e->getMessage());

            // return response()->json([
            //     'response_code' => Response::HTTP_INTERNAL_SERVER_ERROR,
            //     'status' => 'error',
            //     'message' => 'an error occured during logout',
            // ], Response::HTTP_INTERNAL_SERVER_ERROR);

            return $this->execptionResponse($e, 'logout error', 'logout failed');
        }
    }

    /**
     * Success response helper method
     */
    private function authResponse($message, $user = null, $token = null, $statusCode = Response::HTTP_OK)
    {
         $response = [
            'response_code' => $statusCode,
            'status' => 'success',
            'message' => $message,
        ];

        if ($user) {
            $response['user_info'] = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ];
        }

        if ($token) {
            $response['token'] = $token;
            $response['token_type'] = 'bearer';
            $response['expires_in'] = config('sanctum.expiration');
        }

        return response()->json($response, $statusCode);
    }

    private function errorResponse($message, $statusCode)
    {
        return response()->json([
            'response_code' => $statusCode,
            'status' => 'error',
            'message' => $message,
        ], $statusCode);
    }

    private function execptionResponse(Exception $e, $context, $message, $statusCode = Response::HTTP_INTERNAL_SERVER_ERROR)
    {
        Log::error($context . ' : ' . $e->getMessage());

        return response()->json([
            'response_code' => $statusCode,
            'status' => 'error',
            'message' => $message,
        ], $statusCode);
    }
}
