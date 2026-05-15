<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Helpers\ApiResponseHelper;
use App\Http\Requests\API\V1\Transaction\IndexDeletedTransactionsRequest;
use App\Http\Requests\API\V1\Transaction\IndexTransactionsRequest;
use App\Http\Requests\API\V1\Transaction\ShowDeletedTransactionRequest;
use App\Http\Requests\API\V1\Transaction\ShowTransactionRequest;
use App\Http\Requests\API\V1\Transaction\StoreTransactionRequest;
use App\Http\Requests\API\V1\Transaction\UpdateTransactionRequest;
use App\Http\Resources\API\V1\TransactionResource;
use App\Models\Tracker;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedInclude;
use Spatie\QueryBuilder\Enums\FilterOperator;
use Spatie\QueryBuilder\QueryBuilder;

class TransactionController extends Controller
{   
    /**
     * Display a listing of the resource.
     */
    public function index(IndexTransactionsRequest $request, Tracker $tracker)
    {
        $validated = $request->validated();
        $trackerId = $tracker->id;
        $size = $validated['size'];

        $transactions = QueryBuilder::for(Transaction::class)
            ->where('tracker_id', $trackerId)
            ->allowedIncludes('tracker')
            ->allowedFields(
                'id', 'name', 'type', 'amount', 'description', 'date', 'created_at', 'updated_at',
                'tracker.id', 'tracker.name'
            )
            ->allowedFilters(
                'name',
                'description',
                AllowedFilter::exact('type'),
                AllowedFilter::operator('amount', FilterOperator::DYNAMIC),
                AllowedFilter::scope('starts_before', 'dynamicDateFilter')->default('before'),
                AllowedFilter::scope('in_between', 'dynamicDateFilter')->default('between'),
                AllowedFilter::scope('ends_after', 'dynamicDateFilter')->default('after'),
            )
            ->allowedSorts('name', 'amount', 'date', 'created_at', 'updated_at')
            ->defaultSort('-date')
            ->paginate($size);

        return ApiResponseHelper::successResponse(
            message: 'Transactions retrieved successfully.',
            data: TransactionResource::collection($transactions),
        );
    }

    public function indexDeleted(IndexDeletedTransactionsRequest $request)
    {
            $validated = $request->validated();
            $size = $validated['size'];
    
            $transactions = QueryBuilder::for(Transaction::class)
            ->where('user_id', $request->user()->id)
            ->onlyTrashed()
            ->allowedIncludes(
                AllowedInclude::callback(
                    name: 'tracker',
                    callback: fn($query) => $query->withTrashed(),
                )
            )
            ->allowedFields(
                'id', 'name', 'type', 'amount', 'description', 'date', 'created_at', 'updated_at', 'deleted_at',
                'tracker.id', 'tracker.name'
            )
            ->allowedFilters(
                'name',
                'description',
                AllowedFilter::exact('type'),
                AllowedFilter::operator('amount', FilterOperator::DYNAMIC),
                AllowedFilter::scope('starts_before', 'dynamicDateFilter')->default('before'),
                AllowedFilter::scope('in_between', 'dynamicDateFilter')->default('between'),
                AllowedFilter::scope('ends_after', 'dynamicDateFilter')->default('after'),
                AllowedFilter::exact('tracker.id'),
            )
            ->allowedSorts('name', 'amount', 'date', 'created_at', 'updated_at', 'deleted_at')
            ->defaultSort('-deleted_at')
            ->paginate($size);
    
            return ApiResponseHelper::successResponse(
                message: 'Deleted transactions retrieved successfully.',
                data: TransactionResource::collection($transactions),
            );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTransactionRequest $request, Tracker $tracker)
    {
        $validated = $request->validated();
        $transaction = null;

        DB::transaction(function () use ($validated, $tracker, &$transaction) {
            $transaction = Transaction::create($validated);

            if ($transaction->type === 'income') {
                $tracker->increment('current_balance', $transaction->amount);
            } else {
                $tracker->decrement('current_balance', $transaction->amount);
            }
        });

        return ApiResponseHelper::successResponse(
            message: 'Transaction created successfully.',
            data: new TransactionResource($transaction),
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(ShowTransactionRequest $request, Transaction $transaction)
    {
        $transaction = QueryBuilder::for(Transaction::class)
            ->whereKey($transaction->id)
            ->allowedFields(
                'id', 'name', 'type', 'amount', 'description', 'date', 'created_at', 'updated_at',
            )
            ->firstOrFail();

        return ApiResponseHelper::successResponse(
            message: 'Transaction retrieved successfully.',
            data: new TransactionResource($transaction),
        );
    }

    public function showDeleted(ShowDeletedTransactionRequest $request, Transaction $transaction)
    {
        $transaction = QueryBuilder::for(Transaction::class)
            ->onlyTrashed()
            ->whereKey($transaction->id)
            ->allowedFields(
                'id', 'name', 'type', 'amount', 'description', 'date', 'created_at', 'updated_at', 'deleted_at',
                'tracker.id', 'tracker.name'
            )
            ->firstOrFail();

        return ApiResponseHelper::successResponse(
            message: 'Deleted transaction retrieved successfully.',
            data: new TransactionResource($transaction),
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTransactionRequest $request, Transaction $transaction)
    {
        $validated = $request->validated();
        $oldType = $transaction->type;
        $oldAmount = abs($transaction->amount);
        $newType = $validated['type'] ?? null;
        $newAmount = isset($validated['amount']) ? abs($validated['amount']) : null;

        try {

            DB::transaction(function () use ($transaction, $validated, $oldType, $oldAmount, $newType, $newAmount) {
                // Neutralize tracker's current_balance impact if type or amount is changing
                if ((!empty($newType) && $newType !== $oldType) ||
                    (isset($newAmount) && $newAmount != $oldAmount)) {
                    if ($oldType === 'income') {
                        $transaction->tracker->decrement('current_balance', $oldAmount);
                        
                    } else {
                        $transaction->tracker->increment('current_balance', $oldAmount);
                    }
                }

                $transaction->update($validated);
                $transaction->refresh();

                // Adjust tracker's current_balance based on new values if type or amount changed
                if ((!empty($newType) && $newType !== $oldType) ||
                    (isset($newAmount) && $newAmount != $oldAmount)) {
                    $updatedType = $transaction->type;
                    $updatedAmount = abs($transaction->amount);

                    if ($updatedType === 'income') {
                        $transaction->tracker->increment('current_balance', $updatedAmount);
                        
                    } else {
                        $transaction->tracker->decrement('current_balance', $updatedAmount);
                    }
                }
            });

        } catch (\Throwable $e) {
            throw $e;
        }

        return ApiResponseHelper::successResponse(
            message: 'Transaction updated successfully.',
            data: new TransactionResource($transaction),
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function delete(Request $request, Transaction $transaction)
    {
        Gate::authorize('delete', $transaction);

        DB::transaction(function () use ($transaction) {
            if ($transaction->type === 'income') {
                $transaction->tracker->decrement('current_balance', $transaction->amount);

            } else {
                $transaction->tracker->increment('current_balance', $transaction->amount);
            }

            $transaction->delete();
        });

        return ApiResponseHelper::successResponse(
            message: 'Transaction deleted successfully.',
        );
    }

    public function restore(Request $request, Transaction $transaction)
    {
        Gate::authorize('restore', $transaction);

        DB::transaction(function () use ($transaction) {
            if ($transaction->type === 'income') {
                $transaction->tracker->increment('current_balance', $transaction->amount);
                
            } else {
                $transaction->tracker->decrement('current_balance', $transaction->amount);
            }

            $transaction->restore();
        });

        return ApiResponseHelper::successResponse(
            message: 'Transaction restored successfully.',
            data: new TransactionResource($transaction),
        );
    }

    public function forceDelete(Request $request, Transaction $transaction)
    {
        Gate::authorize('forceDelete', $transaction);
        
        $transaction->forceDelete();

        return ApiResponseHelper::successResponse(
            message: 'Transaction permanently deleted successfully.',
        );
    }
}
