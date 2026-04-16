<?php

namespace App\Services\API\V1;

use App\Models\User;
use Illuminate\Support\Facades\Storage;
class UserService
{
    public function changeVerifiedEmail(User $user): void
    {
        $user->email = $user->pending_email;
        $user->pending_email = null;
        $user->save();
    }

    public function moveEmailToPending(User $user, string $newEmail): void
    {
        $user->pending_email = $newEmail;
        $user->save();
    }

    public function revokeAllTokensExceptCurrent(User $user): void
    {
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();
    }

    public function addAvatar(User $user, $avatar): string
    {
        $avatarName = time() . '.' . $avatar->getClientOriginalExtension();
        $avatar->storeAs('users/avatars', $avatarName, 'public');

        return $avatarName;
    }

    public function avatarExists(string $avatarName): bool
    {
        return Storage::disk('public')->exists('users/avatars/' . $avatarName);
    }

    public function removeAvatarFromStorage(string $avatarName): void
    {
        if ($this->avatarExists($avatarName)) {
            Storage::disk('public')->delete('users/avatars/' . $avatarName);
        }
    }
}
