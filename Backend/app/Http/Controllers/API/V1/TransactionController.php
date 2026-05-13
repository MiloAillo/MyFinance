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
use App\Models\Transaction;
use App\Services\API\V1\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedInclude;
use Spatie\QueryBuilder\Enums\FilterOperator;
use Spatie\QueryBuilder\QueryBuilder;

class TransactionController extends Controller
{
    public function __construct(protected TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }
    
    /**
     * Display a listing of the resource.
     */
    public function index(IndexTransactionsRequest $request)
    {
        $validated = $request->validated();
        $trackerId = $validated['tracker_id'];
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
                AllowedFilter::scope('starts_before'),
                AllowedFilter::scope('in_between'),
                AllowedFilter::scope('ends_after'),
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
            $trackerId = $validated['tracker_id'];
            $size = $validated['size'];
    
            $transactions = QueryBuilder::for(Transaction::class)
            ->onlyTrashed()
            ->where('tracker_id', $trackerId)
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
                AllowedFilter::scope('starts_before'),
                AllowedFilter::scope('in_between'),
                AllowedFilter::scope('ends_after'),
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
    public function store(StoreTransactionRequest $request)
    {
        $validated = $request->validated();

        $transaction = Transaction::create($validated);

        $transaction = QueryBuilder::for(Transaction::class)
            ->whereKey($transaction->id)
            ->allowedFields(
                'id', 'name', 'type', 'amount', 'description', 'date', 'created_at', 'updated_at',
            )
            ->firstOrFail();

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

        $transaction->update($validated);

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
        $transaction->delete();

        return ApiResponseHelper::successResponse(
            message: 'Transaction deleted successfully.',
        );
    }

    public function restore(Request $request, Transaction $transaction)
    {
        $transaction->restore();

        return ApiResponseHelper::successResponse(
            message: 'Transaction restored successfully.',
            data: new TransactionResource($transaction),
        );
    }

    public function forceDelete(Request $request, Transaction $transaction)
    {
        $transaction->forceDelete();

        return ApiResponseHelper::successResponse(
            message: 'Transaction permanently deleted successfully.',
        );
    }
}
