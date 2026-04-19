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
use App\Models\User;
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
        $user = User::create($request->validated());

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
        $user = $request['user'];

        if ($this->authService->isVerified($user)) {
            $currentDeviceHash = $this->authService->hashDevice($user->id, $request->userAgent());
            $devices = $user->known_devices ?? collect();

            if ($devices->contains('hash', $currentDeviceHash)) {
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
        $user = $request['user'];

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
        $user = User::where('email', $credentials['email'])->first();

        try {

            DB::transaction(function () use ($credentials, $user) {
                $this->authService->updatePassword($credentials);
                $user->tokens()->delete();
                $this->authService->unsetKnownDevices($user);
                $this->authService->sendCredentialsChangesNotification($user, 'password');
            });
        
        } catch (\Exception $e) {
            throw $e;
        }

        return ApiResponseHelper::successResponse(
            message: 'Password has been reset successfully.',
        );
    }

    // Sign Out
    public function logout(Request $request)
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();

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
        $user = $request->user();

        return ApiResponseHelper::successResponse(
            message: 'User data retrieved successfully.',
            data: new UserResource($user),
        );
    }

    // Update User Data
    public function update(UpdateProfileRequest $request)
    {
        $credentials = $request->validated();
        $user = $request->user();
        $message = null;
        $mustNotBeEmptyFields = ['name', 'email', 'password'];

        try {

            DB::transaction(function () use ($request, $credentials, $user, $mustNotBeEmptyFields, &$message) {

                // MUST HAVE BEARER TOKEN !!!
                if ($request->routeIs('api.v1.users.update.verify.new-email')) {
                    $this->userService->changeVerifiedEmail($user);
                    $user->markEmailAsVerified();
                    $this->authService->unsetKnownDevices($user);
                    $this->userService->revokeAllTokensExceptCurrent($user);
                    $this->authService->sendCredentialsChangesNotification($user, 'email');

                    $message = 'Email updated and verified successfully.';

                    return;
                }

                if ($this->authService->isVerified($user) &&
                    !empty($credentials['email']) &&
                    $credentials['email'] !== $user->getEmailForVerification()) {
                        $this->userService->moveEmailToPending($user, $credentials['email']);
                        unset($credentials['email']);
                        $this->authService->sendVerifiedEmailChangedNotification($user, $user->pending_email);

                        $message = 'Please verify your new email address to finish the process.';
                }

                $data = collect($credentials)
                    ->only($mustNotBeEmptyFields)
                    ->filter(function ($value) {
                        return !empty($value);
                    })
                    ->toArray();

                if ($request->hasFile('avatar')) {
                    $oldAvatar = $user->avatar;
                    $newAvatar = $request->file('avatar');

                    $data['avatar'] = $this->userService->addAvatar($user, $newAvatar);

                    if (!empty($oldAvatar) && $this->userService->avatarExists($oldAvatar)) {
                        $this->userService->removeAvatarFromStorage($oldAvatar);
                    }
                }

                $user->update($data);
                
                if (isset($credentials['password'])) {
                    $this->userService->revokeAllTokensExceptCurrent($user);
                    $this->authService->unsetKnownDevices($user);
                    $this->authService->sendCredentialsChangesNotification($user, 'password');
                }
            });

            return ApiResponseHelper::successResponse(
                message: $message ?? 'User data updated successfully.',
                data: new UserResource($user->fresh()),
            );

        } catch (\Exception $e) {
            throw $e;
        }
    }

    // Email Verification
    public function sendVerificationEmail(SendVerificationEmailRequest $request)
    {
        $user = $request['user'];

        $this->authService->sendVerificationEmailNotification($user);

        return ApiResponseHelper::successResponse(
            message: 'Verification email sent successfully.',
        );
    }

    public function verifyEmail(VerifyEmailRequest $request)
    {
        $user = $request['user'];
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
