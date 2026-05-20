<?php

namespace App\Services\API\V1;

use App\Models\User;
use Illuminate\Support\Facades\Storage;
class UserService
{
    public function createUser(array $data): User
    {
        return User::create($data);
    }

    public function changeVerifiedEmail(User $user): void
    {
        $user->email_verified_at = null;
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
        $user->tokens()->whereKeyNot($user->currentAccessToken()->id)->delete();
    }

    public function addAvatar(User $user, $avatar): string
    {
        $avatarName = time() . '.' . $avatar->extension();
        $avatar->storeAs('', $avatarName, 'avatars');

        return $avatarName;
    }

    public function avatarExists(string $avatarName): bool
    {
        return Storage::disk('avatars')->exists($avatarName);
    }

    public function removeAvatarFromStorage(string $avatarName): void
    {
        if ($this->avatarExists($avatarName)) {
            Storage::disk('avatars')->delete($avatarName);
        }
    }
}
