<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Helpers\ResponseHelper;
use App\Http\Requests\API\V1\User\Auth\ForgotPasswordRequest;
use App\Http\Requests\API\V1\User\Auth\LoginRequest;
use App\Http\Requests\API\V1\User\Auth\RegisterRequest;
use App\Http\Requests\API\V1\User\Auth\ResetPasswordRequest;
use App\Http\Requests\API\V1\User\Auth\ValidatePasswordResetTokenRequest as ValidateResetTokenRequest;
use App\Http\Requests\API\V1\User\Auth\Verification\Email\SendVerificationEmailRequest;
use App\Http\Requests\API\V1\User\Auth\Verification\Email\VerifyEmailRequest;
use App\Models\User;
use App\Notifications\API\V1\User\Auth\ResetPasswordNotification;
use App\Notifications\API\V1\User\Auth\VerificationEmailNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class UserController extends Controller
{
    // AUTHENTICATION

    // Sign Up
    public function store(RegisterRequest $request)
    {
        $user = User::create($request->validated());

        $token = $user->createToken('auth-token')->plainTextToken;

        return ResponseHelper::successResponse(
            data: [
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => config('sanctum.expiration'),
            ],
            message: 'User successfully registered.'
        );
    }

    // Sign In
    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();
        $user = $request['user'];

        $token = $user->createToken('auth-token')->plainTextToken;

        return ResponseHelper::successResponse(
            data: [
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => config('sanctum.expiration'),
            ],
            message: 'User logged in successfully.'
        );
    }

    // Password Resets
    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $user = $request['user'];

        $token = Password::broker()->createToken($user);

        $user->notify(new ResetPasswordNotification($token));

        return ResponseHelper::successResponse(
            message: 'Password reset token has been generated and sent to email.'
        );
    }

    public function validateResetToken(ValidateResetTokenRequest $request)
    {
        return ResponseHelper::successResponse(
            message: 'Password reset token is valid.'
        );
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        $credentials = $request->validated();
        // $user = $request['user'];

        Password::broker()->reset(
            $credentials,
            function ($user, $password) {
                $user->forceFill([
                    'password' => $password
                ])->save();
            }
        );

        return ResponseHelper::successResponse(
            message: 'Password has been reset successfully.'
        );
    }

    // Sign Out
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return ResponseHelper::successResponse(
            message: 'User logged out successfully.'
        );
    }

    // USER MANAGEMENT

    // Get User Data
    public function show(User $user)
    {
        return ResponseHelper::successResponse(
            data: [
                'user' => [
                    'id' => $user->getKey(),
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_verified' => $user->email_verified_at ? true : false,
                    'avatar' => $user->avatar ? asset('storage/avatars/' . $user->avatar) : null,
                ],
            ],
            message: 'User data retrieved successfully.'
        );
    }

    // // Update User Data
    // public function update(Request $request, User $user)
    // {
    //     $validatedData = $request->validated();

    //     $user->update($validatedData);

    //     return ResponseHelper::successResponse(
    //         data: [ 'user' => $user ],
    //         message: 'User data updated successfully.'
    //     );
    // }

    // Email Verification
    public function sendVerificationEmail(SendVerificationEmailRequest $request)
    {
        $user = $request['user'];

        $user->notify(new VerificationEmailNotification($user->email_verified_at));

        return ResponseHelper::successResponse(
            message: 'Verification email sent successfully.'
        );
    }

    public function verifyEmail(VerifyEmailRequest $request)
    {
        $user = $request['user'];

        $user->markEmailAsVerified();

        return ResponseHelper::successResponse(
            message: 'Email verified successfully.'
        );
    }

    // // Delete User
    // public function destroy(User $user)
    // {
    //     $user->delete();

    //     return ResponseHelper::successResponse(
    //         message: 'User data deleted successfully.'
    //     );
    // }
}
