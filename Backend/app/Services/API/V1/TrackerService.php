<?php

namespace App\Services\API\V1;

use App\Models\Tracker;
use App\Models\User;
use App\Notifications\API\V1\User\Auth\ResetPasswordNotification;
use App\Notifications\API\V1\User\Auth\VerificationEmailNotification;
use App\Notifications\API\V1\User\Auth\Verified\CredentialsChangesNotification;
use App\Notifications\API\V1\User\Auth\Verified\NewDeviceLoginDetectedNotification;
use App\Notifications\API\V1\User\Auth\Verified\VerifiedEmailChangedNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class TrackerService
{
    public function createTracker(array $data): Tracker
    {
        return Tracker::create($data);
    }

    public function updateTracker(Tracker $tracker, array $data): Tracker
    {
        $tracker->update($data);
        return $tracker;
    }
}
