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
use App\Http\Requests\API\V1\User\UpdateProfileRequest;
use App\Models\User;
use App\Notifications\API\V1\User\Auth\ResetPasswordNotification;
use App\Notifications\API\V1\User\Auth\VerificationEmailNotification;
use App\Notifications\API\V1\User\Auth\Verified\CredentialsChangesNotification;
use App\Notifications\API\V1\User\Auth\Verified\NewDeviceLoginDetectedNotification;
use App\Notifications\API\V1\User\Auth\Verified\VerifiedEmailChangedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;


class UserController extends Controller
{
    /**
     * AUTHENTICATION
     */

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
        $user = $request['user'];

        if ($user->email_verified_at) {
            $currentDeviceHash = hash('sha256', "$user->id|{$request->userAgent()}");
            $devices = $user->known_devices ?? collect();
            // $devices = collect($user->known_devices ?? []);
            $maxDevices = 5;

            // If the current device is in the known devices list, update the last used timestamp
            if ($devices->contains('hash', $currentDeviceHash)) {
                $devices = $devices->map(function ($device) use ($currentDeviceHash) {
                    if ($device['hash'] === $currentDeviceHash) {
                        $device['last_used_at'] = now();
                    }
                    return $device;
                });
                $user->known_devices = $devices->sortByDesc('last_used_at')->values()->all();
                $user->save();

            } 

            /** 
             * If the current device is not in the known devices list,
             * and the required credentials are valid,
             * and if the known devices list has reached the maximum limit,
             * remove the least recently used device from the list,
             * add the current device to the list
             */

            if (!$devices->contains('hash', $currentDeviceHash)) {
                if ($request->routeIs('api.v1.auth.login.new-device')) {
                    $devices = $devices->push([
                        "hash" => $currentDeviceHash,
                        "last_used_at" => now(),
                    ]);

                    $user->known_devices = $devices->sortByDesc('last_used_at')->take($maxDevices)->values();
                    // dd($user->known_devices);
                    $user->save();

                } else {
                    $user->notify(new NewDeviceLoginDetectedNotification($currentDeviceHash));

                    return ResponseHelper::successResponse(
                        message: 'New device login detected. Please check your email to continue.'
                    );
                }
            }
                
        }

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

        try {

            DB::transaction(function () use ($credentials) {
                Password::broker()->reset(
                    $credentials,
                    function ($user, $password) {
                        $user->forceFill([
                            'password' => $password
                        ])->save();
                    }
                );

                // Invalidate all existing tokens and known devices after password reset
                $user = User::where('email', $credentials['email'])->first();

                $user->tokens()->delete();
                $user->known_devices = null;
                $user->save();

                $user->notify(new CredentialsChangesNotification('password'));
            });
        
        } catch (\Exception $e) {
            throw $e;
        }

        return ResponseHelper::successResponse(
            message: 'Password has been reset successfully.'
        );
    }

    // Sign Out
    public function logout(Request $request)
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();
        
        // if ($user->email_verified_at && !empty($user->known_devices)) {
        //     $currentDeviceHash = hash('sha256', "$user->id|{$request->userAgent()}");
        //     $devices = $user->known_devices;

        //     // Remove the current device from the known devices list upon logout
        //     $devices = $devices->reject(function ($device) use ($currentDeviceHash) {
        //         return $device['hash'] === $currentDeviceHash;
        //     });

        //     $user->known_devices = $devices->values()->all();
        //     $user->save();
        // }

        return ResponseHelper::successResponse(
            message: 'User logged out successfully.'
        );
    }

    /**
     * USER MANAGEMENT
     */

    // Get User Data
    public function show(Request $request)
    {
        $user = $request->user();

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

    // Update User Data
    public function update(UpdateProfileRequest $request)
    {
        $credentials = $request->validated();
        $user = $request->user();
        $message = null;

        try {

            DB::transaction(function () use ($request, $credentials, $user, &$message) {

                /**
                 * If the request has 'change_and_verify_email' which value is true,
                 * and the user of request has pending_email which value is not null,
                 * and hash check shows that both hash is the same and valid
                 * 
                 * move the pending email to email,
                 * removed the pending email,
                 * then mark the new email as verified
                 */

                // MUST HAVE BEARER TOKEN !!!
                // Handle email change and verification if the request is only for email change verification
                if ($request->routeIs('api.v1.users.update.verify.new-email')) {
                    $user->email = $user->pending_email;
                    $user->pending_email = null;
                    $user->markEmailAsVerified();
                    $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();
                    $user->known_devices = null;
                    $user->save();
                    $user->notify(new CredentialsChangesNotification('email'));

                    $message = 'Email updated and verified successfully.';

                    return;
                }

                /** If user has been verified and email is being updated,
                 *  store the new email into pending email,
                 *  remove email from credentials to prevent it from being updated,
                 *  and send verification email to the new email address.
                 * 
                 *  everything will be updated except the email until the new email is verified,
                 *  then the pending email will be moved to email and get removed,
                 *  and the new email will be verified.
                 */

                // Handle email change request if the user is already verified and wants to change email
                if ($user->email_verified_at &&
                    !empty($credentials['email']) &&
                    $credentials['email'] !== $user->getEmailForVerification()) {
                        $user->pending_email = $credentials['email'];
                        unset($credentials['email']);
                        $user->notify(new VerifiedEmailChangedNotification($user->pending_email));
                        $message = 'Please verify your new email address to finish the process.';
                }

                /**
                 * Sort the data to be updated,
                 * only include the fields that are present in the request and not empty.
                 */

                $data = collect($credentials)
                    ->only(['name', 'email', 'password'])
                    ->filter(function ($value) {
                        return !empty($value);
                    })
                    ->toArray();

                // Handle avatar upload if the request has avatar file
                if ($request->hasFile('avatar')) {
                    $oldAvatar = $user->avatar;
                    $newAvatar = $request->file('avatar');

                    $avatarName = time() . '.' . $newAvatar->getClientOriginalExtension();
                    $newAvatar->storeAs('users/avatars', $avatarName, 'public');
                    $data['avatar'] = $avatarName;

                    if (!empty($oldAvatar) &&
                        Storage::disk('public')->exists('users/avatars/' . $oldAvatar)) {
                            Storage::disk('public')->delete('users/avatars/' . $oldAvatar);
                    }
                }

                $user->update($data);
                
                // Invalidate all existing tokens after credentials change except the current token
                if (isset($credentials['password'])) {
                    $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();
                    $user->known_devices = null;
                    $user->save();
                    $user->notify(new CredentialsChangesNotification('password'));
                }
            });

            return ResponseHelper::successResponse(
                data: ['user' => $user->fresh()],
                message: $message ?? 'User data updated successfully.'
            );

        } catch (\Exception $e) {
            throw $e;
        }
    }

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
        $devices = collect();
        $currentDeviceHash = hash('sha256', "$user->id|{$request->userAgent()}");

        $devices->push([
            "hash" => $currentDeviceHash,
            "last_used_at" => now(),
        ]);
        $user->known_devices = $devices;
        $user->markEmailAsVerified();

        return ResponseHelper::successResponse(
            message: 'Email verified successfully.'
        );
    }

    // Delete User
    public function destroy(Request $request)
    {
        $request->user()->delete();

        return ResponseHelper::successResponse(
            message: 'User data deleted successfully.'
        );
    }
}
