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
        $isTrackerFieldsFilled = $request->filled('fields.tracker');
        $isTrackerIncluded = in_array('tracker', explode(',', $request->input('include', '')));

        $transactions = QueryBuilder::for(Transaction::where('tracker_id', $trackerId))
            ->where('user_id', $request->user()->id)
            ->allowedIncludes('tracker')
            ->allowedFields(
                'id', 'tracker_id', 'name', 'type', 'amount', 'description', 'date', 'created_at', 'updated_at',
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
            ->when($isTrackerFieldsFilled || $isTrackerIncluded, function ($query) use ($request, $isTrackerFieldsFilled, $isTrackerIncluded) {
                if ($isTrackerFieldsFilled && !$isTrackerIncluded) {
                    $query->with('tracker');
                }
                
                $transactionFields = $request->input('fields.transactions', '');

                if ($transactionFields) {
                    $transactionFieldList = explode(',', $transactionFields);

                    if (!in_array('tracker_id', $transactionFieldList)) {
                        $transactionFieldList[] = 'tracker_id';
                        $request->merge(['fields' => array_merge($request->input('fields', []), ['transactions' => implode(',', $transactionFieldList)])]);
                    }
                }
            })
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

        $transactions = QueryBuilder::for(Transaction::onlyTrashed())
        ->where('user_id', $request->user()->id)
        ->allowedIncludes(
            AllowedInclude::callback(
                name: 'tracker',
                callback: fn($query) => $query->withTrashed(),
            )
        )
        ->allowedFields(
            'id', 'tracker_id', 'name', 'type', 'amount', 'description', 'date', 'created_at', 'updated_at', 'deleted_at',
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
        ->when($request->filled('fields.tracker'), function ($query) use ($request) {
            $transactionFields = $request->input('fields.transactions', '');

            if ($transactionFields) {
                $transactionFieldList = explode(',', $transactionFields);

                if (!in_array('tracker_id', $transactionFieldList)) {
                    $transactionFieldList[] = 'tracker_id';
                    $request->merge(['fields' => array_merge($request->input('fields', []), ['transactions' => implode(',', $transactionFieldList)])]);
                }
            }

            $query->with(['tracker' => fn($query) => $query->withTrashed()]);
        })
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
            $lockedTracker = Tracker::lockForUpdate()->find($tracker->id);
            $transaction = Transaction::create($validated);

            if ($transaction->type === 'income') {
                $lockedTracker->increment('current_balance', $transaction->amount);
            } else {
                $lockedTracker->decrement('current_balance', $transaction->amount);
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
        $transaction = QueryBuilder::for(Transaction::whereKey($transaction->id))
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
        $transaction = QueryBuilder::for(Transaction::onlyTrashed())
            ->whereKey($transaction->id)
            ->allowedFields(
                'id', 'tracker_id', 'name', 'type', 'amount', 'description', 'date', 'created_at', 'updated_at', 'deleted_at',
                'tracker.id', 'tracker.name'
            )
            ->when($request->filled('fields.tracker'), function ($query) use ($request) {
                $transactionFields = $request->input('fields.transactions', '');

                if ($transactionFields) {
                    $transactionFieldList = explode(',', $transactionFields);

                    if (!in_array('tracker_id', $transactionFieldList)) {
                        $transactionFieldList[] = 'tracker_id';
                        $request->merge(['fields' => array_merge($request->input('fields'), ['transactions' => implode(',', $transactionFieldList)])]);
                    }
                }

                $query->with(['tracker' => fn($query) => $query->withTrashed()]);
            })
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

        DB::transaction(function () use ($transaction, $validated) {
            $lockedTransaction = Transaction::lockForUpdate()->find($transaction->id);
            $lockedTracker = Tracker::lockForUpdate()->find($lockedTransaction->tracker_id);

            // Neutralize tracker's current_balance impact if type or amount is changing
            $oldMultiplier = $lockedTransaction->type === 'income' ? 1 : -1;
            $oldAmountImpact = abs($lockedTransaction->amount) * $oldMultiplier;

            $lockedTransaction->update($validated);
            $lockedTransaction->refresh();

            // Adjust tracker's current_balance based on new values if type or amount changed
            $newMultiplier = $lockedTransaction->type === 'income' ? 1 : -1;
            $newAmountImpact = abs($lockedTransaction->amount) * $newMultiplier;

            $difference = $newAmountImpact - $oldAmountImpact;

            if ($difference > 0) {
                $lockedTracker->increment('current_balance', $difference);
            } elseif ($difference < 0) {
                $lockedTracker->decrement('current_balance', abs($difference));
            }
        });

        return ApiResponseHelper::successResponse(
            message: 'Transaction updated successfully.',
            data: new TransactionResource($transaction->refresh()),
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function delete(Request $request, Transaction $transaction)
    {
        Gate::authorize('delete', $transaction);

        DB::transaction(function () use ($transaction) {
            $lockedTransaction = Transaction::lockForUpdate()->find($transaction->id);
            $lockedTracker = Tracker::lockForUpdate()->find($lockedTransaction->tracker_id);

            if ($lockedTransaction->type === 'income') {
                $lockedTracker->decrement('current_balance', $lockedTransaction->amount);

            } else {
                $lockedTracker->increment('current_balance', $lockedTransaction->amount);
            }

            $lockedTransaction->delete();
        });

        return ApiResponseHelper::successResponse(
            message: 'Transaction deleted successfully.',
        );
    }

    public function restore(Request $request, Transaction $transaction)
    {
        Gate::authorize('restore', $transaction);

        DB::transaction(function () use ($transaction) {
            $lockedTransaction = Transaction::withTrashed()->lockForUpdate()->find($transaction->id);
            $lockedTracker = Tracker::withTrashed()->lockForUpdate()->find($lockedTransaction->tracker_id);

            if ($lockedTransaction->type === 'income') {
                $lockedTracker->increment('current_balance', $lockedTransaction->amount);
                
            } else {
                $lockedTracker->decrement('current_balance', $lockedTransaction->amount);
            }

            $lockedTransaction->restore();
        });

        return ApiResponseHelper::successResponse(
            message: 'Transaction restored successfully.',
        );
    }

    public function forceDelete(Request $request, Transaction $transaction)
    {
        Gate::authorize('forceDelete', $transaction);

        DB::transaction(fn() => Transaction::withTrashed()->lockForUpdate()->find($transaction->id)->forceDelete());

        return ApiResponseHelper::successResponse(
            message: 'Transaction permanently deleted successfully.',
        );
    }
}
