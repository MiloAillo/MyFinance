<?php

namespace App\Http\Controllers;

use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|min:6|max:50|unique:users',
                'email'    => 'required|string|email|unique:users',
                'password' => 'required|string|min:6',
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email'    => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            $token = $user->createToken('authToken')->plainTextToken;

            return response()->json([
                'response_code' => Response::HTTP_CREATED,
                'status' => 'success',
                'message' => 'user successfully registered',
                'user_info' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => config('sanctum.expiration'),
            ], Response::HTTP_CREATED);

        } catch (ValidationException $e) {
            return response()->json([
                'response_code' => Response::HTTP_UNPROCESSABLE_ENTITY,
                'status' => 'error',
                'message' => 'validation failed',
                'errors' => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);

        } catch (\Exception $e) {
            Log::error('registration error : ' . $e->getMessage());

            return response()->json([
                'response_code' => Response::HTTP_INTERNAL_SERVER_ERROR,
                'status' => 'error',
                'message' => 'registration failed, please try again later',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function login(Request $request)
    {
        try {
            $credentials = $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            if (!Auth::attempt($credentials)) {
                return response()->json([
                    'response_code' => Response::HTTP_UNAUTHORIZED,
                    'status' => 'error',
                    'message' => 'invalid credentials',
                ], Response::HTTP_UNAUTHORIZED);
            }

            $user = Auth::user();
            $user->tokens()->delete();
            $token = $user->createToken('authToken')->plainTextToken;

            return response()->json([
                'response_code' => Response::HTTP_OK,
                'status' => 'success',
                'message' => 'login successful',
                'user_info' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => config('sanctum.expiration'),
            ], Response::HTTP_OK);

        } catch (ValidationException $e) {
            return response()->json([
                'response_code' => Response::HTTP_UNPROCESSABLE_ENTITY,
                'status' => 'error',
                'message' => 'validation failed',
                'errors' => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);

        } catch (\Exception $e) {
            Log::error('login error : ' . $e->getMessage());

            return response()->json([
                'response_code' => Response::HTTP_INTERNAL_SERVER_ERROR,
                'status' => 'error',
                'message' => 'login failed, please try again later',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            if ($user) {
                $user->tokens()->delete();

                return response()->json([
                    'response_code' => Response::HTTP_OK,
                    'status' => 'success',
                    'message' => 'user successfully logged out',
                ], Response::HTTP_OK);
            }

            return response()->json([
                'response_code' => Response::HTTP_UNAUTHORIZED,
                'status' => 'error',
                'message' => 'user not authenticated'
            ], Response::HTTP_UNAUTHORIZED);
        } catch (\Exception $e) {
            Log::error('logout error : ' . $e->getMessage());

            return response()->json([
                'response_code' => Response::HTTP_INTERNAL_SERVER_ERROR,
                'status' => 'error',
                'message' => 'an error occured during logout',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
