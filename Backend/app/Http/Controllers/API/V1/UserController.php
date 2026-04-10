<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Helpers\ResponseHelper;
use App\Http\Requests\API\V1\User\Auth\ForgotPasswordRequest;
use App\Http\Requests\API\V1\User\Auth\LoginRequest;
use App\Http\Requests\API\V1\User\Auth\RegisterRequest;
use App\Http\Requests\API\V1\User\Auth\ResetPasswordRequest;
use App\Http\Requests\API\V1\User\Auth\ValidatePasswordResetTokenRequest as ValidateResetTokenRequest;
use App\Models\User;
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
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
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
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
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

        $token = $user->createPasswordResetToken();

        $user->sendPasswordResetNotification($token);

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
    // public function show(User $user)
    // {
    //     return ResponseHelper::successResponse(
    //         data: [
    //             'user' => [
    //                 'id' => $user->id,
    //                 'name' => $user->name,
    //                 'email' => $user->email,
    //                 'avatar' => $user->avatar,
    //             ],
    //         ],
    //         message: 'User data retrieved successfully.'
    //     );
    // }

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

    // // Delete User
    // public function destroy(User $user)
    // {
    //     $user->delete();

    //     return ResponseHelper::successResponse(
    //         message: 'User data deleted successfully.'
    //     );
    // }
}
