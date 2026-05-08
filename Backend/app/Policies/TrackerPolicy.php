<?php

namespace App\Policies;

use App\Models\Tracker;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TrackerPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function viewAnyDeleted(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Tracker $tracker): bool
    {
        return $user->id === $tracker->user_id;
    }

    public function viewDeleted(User $user, Tracker $tracker): bool|Response
    {
        if (!$tracker->trashed()) {
            return Response::deny('Tracker must be deleted first.');
        }
        
        return $user->id === $tracker->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Tracker $tracker): bool|Response
    {
        if ($tracker->trashed()) {
            return Response::deny('Cannot update a deleted tracker.');
        }

        return $user->id === $tracker->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Tracker $tracker): bool|Response
    {
        if ($tracker->trashed()) {
            return Response::deny('Tracker is already deleted.');
        }

        return $user->id === $tracker->user_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Tracker $tracker): bool|Response
    {
        if (!$tracker->trashed()) {
            return Response::deny('Tracker must be soft-deleted before it can be restored.');
        }

        return $user->id === $tracker->user_id;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Tracker $tracker): bool|Response
    {
        if (!$tracker->isForceDeletable()) {
            return Response::deny('Tracker must be soft-deleted before it can be permanently deleted.');
        }

        return $user->id === $tracker->user_id;
    }
}
