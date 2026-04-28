<?php

namespace App\Http\Controllers\API\V1;

use App\Exceptions\API\V1\Auth\NewDeviceLoginDetectedException;
use App\Http\Helpers\ApiResponseHelper;
use App\Http\Requests\API\V1\User\Auth\ForgotPasswordRequest;
use App\Http\Requests\API\V1\User\Auth\LoginRequest;
use App\Http\Requests\API\V1\User\Auth\RegisterRequest;
use App\Http\Requests\API\V1\User\Auth\ResetPasswordRequest;
use App\Http\Requests\API\V1\User\Auth\ValidatePasswordResetTokenRequest as ValidateResetTokenRequest;
use App\Http\Requests\API\V1\User\Auth\Verification\Email\SendVerificationEmailRequest;
use App\Http\Requests\API\V1\User\Auth\Verification\Email\VerifyEmailRequest;
use App\Http\Requests\API\V1\User\UpdateProfileRequest;
use App\Http\Resources\API\V1\UserResource;
use App\Services\API\V1\AuthService;
use App\Services\API\V1\UserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


class UserController extends Controller
{
    public function __construct(protected AuthService $authService, protected UserService $userService)
    {
        $this->authService = $authService;
        $this->userService = $userService;
    }
    
    /**
     * AUTHENTICATION
     */

    // Sign Up
    public function store(RegisterRequest $request)
    {
        $user = $this->userService->createUser($request->only('name', 'email', 'password'));
        $token = $user->createToken('auth-token')->plainTextToken;

        return ApiResponseHelper::successResponse(
            message: 'User registered successfully.',
            data: collect(new UserResource($user->fresh()))->mergeRecursive([
                'data' => [
                    'meta' => [
                        'token' => $token,
                        'token_type' => 'Bearer',
                        'expires_in' => config('sanctum.expiration'),
                    ],
                ],
            ]),
        );
    }

    // Sign In
    public function login(LoginRequest $request)
    {
        $user = $request->user;

        if ($user->isVerified()) {
            $currentDeviceHash = $request->currentDeviceHash;

            if ($this->authService->isDeviceKnown($user, $currentDeviceHash)) {
                $this->authService->updateLastTimeDeviceUsed($user, $currentDeviceHash);

            } else {
                if ($request->routeIs('api.v1.auth.login.new-device')) {
                    $this->authService->addDevice($user, $currentDeviceHash);

                } else {
                    $this->authService->sendNewDeviceLoginDetectedNotification($user, $currentDeviceHash);

                    throw new NewDeviceLoginDetectedException('Please check your email to continue.');
                }
            }   
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return ApiResponseHelper::successResponse(
            message: 'User logged in successfully.',
            data: collect(new UserResource($user->fresh()))->mergeRecursive([
                'data' => [
                    'meta' => [
                        'token' => $token,
                        'token_type' => 'Bearer',
                        'expires_in' => config('sanctum.expiration'),
                    ],
                ],
            ]),
        );
    }

    // Password Resets
    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $user = $request->user;
        $token = $this->authService->makePasswordResetToken($user);

        $this->authService->sendResetPasswordNotification($user, $token);

        return ApiResponseHelper::successResponse(
            message: 'Password reset token has been generated and sent to email.',
        );
    }

    public function validateResetToken(ValidateResetTokenRequest $request)
    {
        return ApiResponseHelper::successResponse(
            message: 'Password reset token is valid.',
        );
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        $credentials = $request->validated();
        $user = $request->user;
        $email = $credentials['email'];

        try {

            DB::transaction(function () use ($credentials, $user, $email) {
                $this->authService->updatePassword($credentials);
                $user->tokens()->delete();
                $this->authService->unsetKnownDevices($user);
                $this->authService->sendCredentialsChangesNotification($email, 'password');
            });
        
        } catch (\Throwable $e) {
            throw $e;
        }

        return ApiResponseHelper::successResponse(
            message: 'Password has been reset successfully.',
        );
    }

    // Sign Out
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return ApiResponseHelper::successResponse(
            message: 'User logged out successfully.',
        );
    }

    /**
     * USER MANAGEMENT
     */

    // Get User Data
    public function show(Request $request)
    {
        return ApiResponseHelper::successResponse(
            message: 'User data retrieved successfully.',
            data: new UserResource($request->user()),
        );
    }

    // Update User Data
    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $credentials = $request->validated();
        $credentials['password'] = $request->newPassword;
        $currentEmail = $request->currentEmail;
        $message = null;
        $mustNotBeEmptyFields = ['name', 'email', 'password'];

        try {

            DB::transaction(function () use ($request, $user, $credentials, $currentEmail, $mustNotBeEmptyFields, &$message) {

                // MUST HAVE BEARER TOKEN !!!
                if ($request->routeIs('api.v1.users.update.verify.new-email')) {
                    $this->userService->changeVerifiedEmail($user);
                    $user->markEmailAsVerified();
                    $this->userService->revokeAllTokensExceptCurrent($user);
                    $this->authService->unsetKnownDevicesExceptCurrent($user);
                    $this->authService->sendCredentialsChangesNotification($currentEmail, 'email');

                    $message = 'Email updated and verified successfully.';

                    return;
                }

                if ($user->isVerified() &&
                    !empty($credentials['email']) &&
                    $credentials['email'] !== $currentEmail) {
                        $this->userService->moveEmailToPending($user, $credentials['email']);
                        unset($credentials['email']);
                        $this->authService->sendVerifiedEmailChangedNotification($user, $user->pending_email);

                        $message = 'Please verify your new email address to finish the process.';
                }

                $data = collect($credentials)
                    ->only($mustNotBeEmptyFields)
                    ->filter(fn($value) => !empty($value))
                    ->toArray();

                if ($request->hasFile('avatar') || $request->input('avatar') === 'null') {
                    $oldAvatar = $user->avatar;
                    $newAvatar = $request->file('avatar');

                    if (!empty($newAvatar)) {
                        $data['avatar'] = $this->userService->addAvatar($user, $newAvatar);
                    } else {
                        $data['avatar'] = null;
                    }

                    if (!empty($oldAvatar) && $this->userService->avatarExists($oldAvatar)) {
                        $this->userService->removeAvatarFromStorage($oldAvatar);
                    }
                }

                $user->update($data);
                
                /**
                 * the email parameter here is only for unverified users.
                 * since verified users will have their new email moved to pending and later the email from array will be unset,
                 * so the email from array here will be skipped in the check
                **/

                if (isset($credentials['password']) || (!empty($credentials['email']) && $credentials['email'] !== $currentEmail)) {
                    $this->userService->revokeAllTokensExceptCurrent($user);
                    $this->authService->unsetKnownDevicesExceptCurrent($user);

                    if ($user->isVerified()) {
                        $this->authService->sendCredentialsChangesNotification($currentEmail, 'password');
                    }
                }
            });

            return ApiResponseHelper::successResponse(
                message: $message ?? 'User data updated successfully.',
                data: new UserResource($user->fresh()),
            );

        } catch (\Throwable $e) {
            throw $e;
        }
    }

    // Email Verification
    public function sendVerificationEmail(SendVerificationEmailRequest $request)
    {
        $this->authService->sendVerificationEmailNotification($request->user());

        return ApiResponseHelper::successResponse(
            message: 'Verification email sent successfully.',
        );
    }

    public function verifyEmail(VerifyEmailRequest $request)
    {
        $user = $request->user;
        $currentDeviceHash = $this->authService->hashDevice($user->id, $request->userAgent());

        $this->authService->addDevice($user, $currentDeviceHash);
        $user->markEmailAsVerified();

        return ApiResponseHelper::successResponse(
            message: 'Email verified successfully.',
        );
    }

    // Delete User
    public function destroy(Request $request)
    {
        $request->user()->delete();

        return ApiResponseHelper::successResponse(
            message: 'User data deleted successfully.',
        );
    }
}
