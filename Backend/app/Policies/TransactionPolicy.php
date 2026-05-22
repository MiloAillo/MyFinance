<?php

namespace App\Policies;

use App\Models\Tracker;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TransactionPolicy
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
    public function view(User $user, Transaction $transaction): bool
    {
        return $user->getKey() === $transaction->user_id;
    }

    public function viewDeleted(User $user, Transaction $transaction): bool|Response
    {
        if (!$transaction->trashed()) {
            return Response::deny('Transaction must be deleted first.');
        }
        
        return $user->getKey() === $transaction->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, Tracker $tracker): bool
    {
        return $user->getKey() === $tracker->user_id;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Transaction $transaction): bool|Response
    {
        if ($transaction->trashed()) {
            return Response::deny('Cannot update a deleted transaction.');
        }

        return $user->getKey() === $transaction->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Transaction $transaction): bool|Response
    {
        if ($transaction->trashed()) {
            return Response::deny('Transaction is already deleted.');
        }

        return $user->getKey() === $transaction->user_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Transaction $transaction): bool|Response
    {
        if (optional($transaction->tracker)->trashed()) {
            return Response::deny('Cannot restore transaction because its tracker is deleted.');
        }

        if (!$transaction->trashed()) {
            return Response::deny('Transaction must be deleted first.');
        }

        return $user->getKey() === $transaction->user_id;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Transaction $transaction): bool|Response
    {
        if (!$transaction->trashed()) {
            return Response::deny('Transaction must be deleted first.');
        }

        return $user->getKey() === $transaction->user_id;
    }
}
