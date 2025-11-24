<?php
namespace App\Http\Controllers\API;

use App\Helpers\ResponseHelper;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use Illuminate\Cache\RateLimiter;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Register a new user.
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

            return ResponseHelper::createdResponse(
                [
                    'user_info' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ],
                    'token' => $token,
                    'token_type' => 'Bearer.',
                    'expires_in' => config('sanctum.expiration'),
                ],
                'User successfully registered.'
            );

        } catch (\Exception $e) {

            return ResponseHelper::logAndErrorResponse($e, 'Registration error', 'Registration failed.');
        }
    }

    /**
     * Login the user.
     */
    public function login(LoginRequest $request)
    {
        try {
            $credentials = $request->validated();

            $user = User::where('email', $credentials['email'])->first();
            if (!$user || !Hash::check($credentials['password'], $user->password)) {
                return ResponseHelper::unauthorizedResponse('Invalid credentials.');
            }

            $token = $user->createToken('authToken')->plainTextToken;

            return ResponseHelper::successResponse(
                [
                    'user_info' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ],
                    'token' => $token,
                    'token_type' => 'Bearer.',
                    'expires_in' => config('sanctum.expiration'),
                ],
                'Login successful.', Response::HTTP_OK
            );

        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Login error', 'Login failed.');
        }
    }

    /**
     * Logout the authenticated user.
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return ResponseHelper::unauthorizedResponse('User not authenticated.');
            }

            $user->currentAccessToken()->delete();

            return ResponseHelper::successResponse(
                null,
                'User successfully logged out.',
                Response::HTTP_OK
            );

        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Logout error', 'Logout failed.');
        }
    }

    /**
     * Handle forgot password request.
     */
    public function forgotPassword(ForgotPasswordRequest $request)
    {
        try {
            $status = Password::sendResetLink(
                $request->only('email')
            );

            if ($status !== Password::RESET_LINK_SENT) {
                return ResponseHelper::errorResponse(
                    'Unable to send password reset link.', Response::HTTP_BAD_REQUEST
                );
            }

            return ResponseHelper::successResponse(
                null,
                // Token will be expired in (60) minutes as config and it (request) delays for (60) in seconds
                'Password reset link sent to your email address.',
                Response::HTTP_OK
            );
            
        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Forgot password error', 'Unable to process password reset request.');
        }
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        try {
            $throttleKey = 'reset-password:' . $request->email;
            $maxAttempts = 5;

            if (app(RateLimiter::class)->tooManyAttempts($throttleKey, $maxAttempts)) {
                return ResponseHelper::errorResponse(
                    'Too many password reset attempts. Please try again later.', Response::HTTP_TOO_MANY_REQUESTS
                );
            };

            app(RateLimiter::class)->hit($throttleKey, 3600);

            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),

                function (User $user, string $password) {
                    $user->forceFill([
                        'password' => Hash::make($password)
                    ])->setRememberToken(Str::random(60));

                    $user->save();
                }
            );

            if ($status !== Password::PASSWORD_RESET) {
                return ResponseHelper::errorResponse(
                    'Invalid or expired reset token.', Response::HTTP_BAD_REQUEST
                );
            }

            app(RateLimiter::class)->clear($throttleKey);

            return ResponseHelper::successResponse(
                null,
                'Password has been reset successfully.',
                Response::HTTP_OK
            );

        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Reset password error', 'Unable to reset password.');
        }
    }
}
