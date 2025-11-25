<?php

namespace App\Http\Controllers\API;

use App\Helpers\ResponseHelper;
use App\Http\Controllers\API\Controller;
use App\Http\Requests\DeleteAvatarRequest;
use App\Http\Requests\UpdateAvatarRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AvatarController extends Controller
{
    /**
     * Update authenticated user's avatar.
     */
    public function update(UpdateAvatarRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            $file = $request->file('avatar');

            // Unique filename: {timestamp}.{ext}
            $ext = $file->getClientOriginalExtension();
            $filename = now()->format('YmdHis') . '.' . $ext;
            
            // Store on the 'public' disk under avatars/{userId}/ folder
            $path = $file->storeAs('avatars', $user->id . '/' . $filename, 'public');

            // Delete previous avatar if exists
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            // Assign and save (use attribute assignment to avoid fillable issues)
            $user->avatar = $path;
            $user->save();

            return ResponseHelper::successResponse(
                [
                    'avatar_url' => Storage::disk('public')->url($path),
                    'avatar_path' => $path,
                ],
                'Avatar updated successfully.'
            );

        } catch (\Exception $e) {
            
            return ResponseHelper::logAndErrorResponse($e, 'Avatar update error', 'Failed to update avatar.');
        }
    }

    /**
     * Delete authenticated user's avatar.
     */
    public function delete(DeleteAvatarRequest $request): JsonResponse
    {
        try {
            $user = $request->user();

            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
                $user->avatar = null;
                $user->save();
            }

        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Avatar delete error', 'Failed to delete avatar.');
        }
        
        return ResponseHelper::successResponse(null, 'Avatar deleted successfully.');
    }  
}