<?php

namespace App\Http\Controllers\API;

use App\Helpers\ResponseHelper;
use App\Http\Requests\GetProfileRequest;
use App\Http\Requests\UpdateProfileRequest;
use Illuminate\Support\Facades\Hash;

class ProfileController
{
    public function get(GetProfileRequest $request)
    {
        try {
            $user = $request->user();

            return ResponseHelper::successResponse($user, 'Profile fetched successfully.');
        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Profile fetch error', 'Failed to fetch profile.');
        }
    }

    public function patch(UpdateProfileRequest $request)
    {
        try {
            $user = $request->user();
            $credentials = $request->validated();

            if (isset($credentials['password'])) {
                $credentials['password'] = Hash::make($credentials['password']);
            }

            $user->update($credentials);
            $user->refresh();

            return ResponseHelper::successResponse($user, 'Profile updated successfully.');
        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Profile update error', 'Failed to update profile.');
        }
    }
}
