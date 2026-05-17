<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Helpers\ApiResponseHelper;
use App\Http\Requests\API\V1\Tracker\IndexDeletedTrackerRequest;
use App\Http\Requests\API\V1\Tracker\IndexTrackersRequest;
use App\Http\Requests\API\V1\Tracker\ShowDeletedTrackerRequest;
use App\Http\Requests\API\V1\Tracker\ShowTrackerRequest;
use App\Http\Requests\API\V1\Tracker\StoreTrackerRequest;
use App\Http\Requests\API\V1\Tracker\UpdateTrackerRequest;
use App\Http\Resources\API\V1\TrackerResource;
use App\Models\Tracker;
use App\Services\API\V1\TrackerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Spatie\QueryBuilder\AllowedInclude;
use Spatie\QueryBuilder\QueryBuilder;

class TrackerController extends Controller
{
    public function __construct(protected TrackerService $trackerService)
    {
        $this->trackerService = $trackerService;
    }

    public function index(IndexTrackersRequest $request)
    {
        $validated = $request->validated();
        $transactionSize = $validated['transaction_size'];
        $trackerSize = $validated['size'];
        
        $whitelistedTransactionAttributes = ['tracker_id', 'amount', 'type'];
        $requestedTransactionFields = $request->input('fields.transactions', '');
        $filteredTransactionFields = array_values(
            array_intersect($whitelistedTransactionAttributes, explode(',', $requestedTransactionFields))
        );

        $trackers = QueryBuilder::for(Tracker::class)
            ->where('user_id', $request->user()->id)
            ->allowedFields(
                'id', 'name', 'description', 'current_balance', 'created_at', 'updated_at',
                'transactions.id', 'transactions.tracker_id', 'transactions.amount', 'transactions.type'
            )
            ->allowedIncludes(
                AllowedInclude::callback(
                    name: 'recent_transactions',
                    callback: function ($query) use ($transactionSize, $whitelistedTransactionAttributes, $filteredTransactionFields) {
                        if (empty($filteredTransactionFields)) {
                            $query->select(['id', ...$whitelistedTransactionAttributes]);

                        } else {
                            $query->select(array_unique(array_merge_recursive(['id', 'tracker_id'], $filteredTransactionFields)));
                        }

                        return $query->latest('updated_at')->limit($transactionSize);
                    },
                    internalName: 'transactions'
                ),
            )
            ->allowedFilters('name', 'description')
            ->allowedSorts('name', 'created_at', 'updated_at')
            ->defaultSort('-updated_at')
            ->paginate($trackerSize);

        if ($request->input('include') === 'recent_transactions') {
            $trackerData = response()->json($trackers)->getData(true)['data'];
            $transactions = collect($trackerData)->pluck('transactions')->flatten(1);
            $transactionsByTracker = $transactions->groupBy('tracker_id');

            $includedTransactions = $transactions->map(function ($transaction) use ($whitelistedTransactionAttributes, $filteredTransactionFields) {
                $id = (string) $transaction['id'];
                $attributes = empty($filteredTransactionFields) 
                    ? collect($transaction)->only($whitelistedTransactionAttributes)
                    : collect($transaction)->only($filteredTransactionFields);

                if ($attributes->has('tracker_id')) {
                    $attributes['tracker_id'] = (string) $attributes['tracker_id'];
                }

                return [
                    'type' => 'transactions',
                    'id' => $id,
                    'attributes' => $attributes->all(),
                    'links' => [
                        'self' => route('api.v1.transactions.show', $id),
                        'tracker' => route('api.v1.trackers.show', $transaction['tracker_id'])
                    ]
                ];
            })->unique('id')->values()->all();

            $baseResponse = TrackerResource::collection($trackers)->toResponse($request)->getData(true);

            $baseResponse['data'] = collect($baseResponse['data'])->map(function ($tracker) use ($transactionsByTracker) {
                $relatedTransactions = $transactionsByTracker->get($tracker['id'], collect());

                $tracker['relationships'] = [
                    'transactions' => [
                        'data' => $relatedTransactions->map(fn($transaction) => [
                            'type' => 'transactions',
                            'id' => (string) $transaction['id']
                        ])->values()->all()
                    ]
                ];

                return $tracker;
            })->toArray();

            $baseResponse['included'] = $includedTransactions;
            $completeTrackerCollection = $baseResponse;
        }

        return ApiResponseHelper::successResponse(
            message: 'Trackers retrieved successfully.',
            data: $completeTrackerCollection ?? TrackerResource::collection($trackers),
        );
    }

    public function indexDeleted(IndexDeletedTrackerRequest $request)
    {
        $validated = $request->validated();
        $transactionSize = $validated['transaction_size'];
        $trackerSize = $validated['size'];
        
        $whitelistedTransactionAttributes = ['tracker_id', 'amount', 'type'];
        $requestedTransactionFields = $request->input('fields.transactions', '');
        $filteredTransactionFields = array_values(
            array_intersect($whitelistedTransactionAttributes, explode(',', $requestedTransactionFields))
        );

        $trackers = QueryBuilder::for(Tracker::onlyTrashed())
            ->where('user_id', $request->user()->id)
            ->allowedFields(
                'id', 'name', 'description', 'current_balance', 'created_at', 'updated_at', 'deleted_at',
                'transactions.id', 'transactions.tracker_id', 'transactions.amount', 'transactions.type'
            )
            ->allowedIncludes(
                AllowedInclude::callback(
                    name: 'recent_transactions',
                    callback: function ($query) use ($transactionSize, $whitelistedTransactionAttributes, $filteredTransactionFields) {
                        if (empty($filteredTransactionFields)) {
                            $query->select(['id', ...$whitelistedTransactionAttributes]);

                        } else {
                            $query->select(array_unique(array_merge_recursive(['id', 'tracker_id'], $filteredTransactionFields)));
                        }

                        return $query->onlyTrashed()->latest('updated_at')->limit($transactionSize);
                    },
                    internalName: 'transactions'
                ),
            )
            ->allowedFilters('name', 'description')
            ->allowedSorts('name', 'created_at', 'updated_at')
            ->defaultSort('-updated_at')
            ->paginate($trackerSize);

        if ($request->input('include') === 'recent_transactions') {
            $trackerData = response()->json($trackers)->getData(true)['data'];
            $transactions = collect($trackerData)->pluck('transactions')->flatten(1);
            $transactionsByTracker = $transactions->groupBy('tracker_id');

            $includedTransactions = $transactions->map(function ($transaction) use ($whitelistedTransactionAttributes, $filteredTransactionFields) {
                $id = (string) $transaction['id'];
                $attributes = empty($filteredTransactionFields) 
                    ? collect($transaction)->only($whitelistedTransactionAttributes)
                    : collect($transaction)->only($filteredTransactionFields);

                if ($attributes->has('tracker_id')) {
                    $attributes['tracker_id'] = (string) $attributes['tracker_id'];
                }

                return [
                    'type' => 'transactions',
                    'id' => $id,
                    'attributes' => $attributes->all(),
                    'links' => [
                        'self' => route('api.v1.transactions.show', $id),
                        'tracker' => route('api.v1.trackers.show', $transaction['tracker_id'])
                    ]
                ];
            })->unique('id')->values()->all();

            $baseResponse = TrackerResource::collection($trackers)->toResponse($request)->getData(true);

            $baseResponse['data'] = collect($baseResponse['data'])->map(function ($tracker) use ($transactionsByTracker) {
                $relatedTransactions = $transactionsByTracker->get($tracker['id'], collect());

                $tracker['relationships'] = [
                    'transactions' => [
                        'data' => $relatedTransactions->map(fn($transaction) => [
                            'type' => 'transactions',
                            'id' => (string) $transaction['id']
                        ])->values()->all()
                    ]
                ];

                return $tracker;
            })->toArray();

            $baseResponse['included'] = $includedTransactions;
            $completeTrackerCollection = $baseResponse;
        }

        return ApiResponseHelper::successResponse(
            message: 'Trackers retrieved successfully.',
            data: $completeTrackerCollection ?? TrackerResource::collection($trackers),
        );
    }

    public function store(StoreTrackerRequest $request)
    {   
        $tracker = Tracker::create($request->validated());

        return ApiResponseHelper::successResponse(
            message: 'Tracker created successfully.',
            data: new TrackerResource($tracker->fresh()),
        );
    }

    public function show(ShowTrackerRequest $request, Tracker $tracker)
    {
        $tracker = QueryBuilder::for(Tracker::class)
            ->where('id', $tracker->id)
            ->allowedFields('id', 'name', 'description', 'current_balance', 'created_at', 'updated_at')
            ->firstOrFail();

        return ApiResponseHelper::successResponse(
            message: 'Tracker retrieved successfully.',
            data: new TrackerResource($tracker),
        );
    }

    public function showDeleted(ShowDeletedTrackerRequest $request, Tracker $tracker)
    {
        $tracker = QueryBuilder::for(Tracker::class)
            ->onlyTrashed()
            ->where('id', $tracker->id)
            ->allowedFields('id', 'name', 'description', 'current_balance', 'created_at', 'updated_at', 'deleted_at')
            ->firstOrFail();

        return ApiResponseHelper::successResponse(
            message: 'Deleted tracker retrieved successfully.',
            data: new TrackerResource($tracker),
        );
    }

    public function update(UpdateTrackerRequest $request, Tracker $tracker)
    {
        $tracker->update($request->validated());

        return ApiResponseHelper::successResponse(
            message: 'Tracker updated successfully.',
            data: new TrackerResource($tracker->fresh()),
        );
    }

    public function delete(Request $request, Tracker $tracker)
    {
        Gate::authorize('delete', $tracker);

        try {

            DB::transaction(function () use ($tracker) {
                $tracker->delete();

                if ($tracker->transactions()->exists()) {
                    $tracker->transactions()->delete();
                }
            });
            
        } catch (\Throwable $e) {
            throw $e;
        }

        return ApiResponseHelper::successResponse(
            message: 'Tracker deleted successfully.',
        );
    }

    public function restore(Request $request, Tracker $tracker)
    {
        Gate::authorize('restore', $tracker);

        try {
                
            DB::transaction(function () use ($tracker) {
                $tracker->restore();

                if ($tracker->transactions()->onlyTrashed()->exists()) {
                    $tracker->transactions()->onlyTrashed()->restore();
                }
            });

        } catch (\Throwable $e) {
            throw $e;
        }

        return ApiResponseHelper::successResponse(
            message: 'Tracker restored successfully.',
        );
    }

    public function forceDelete(Request $request, Tracker $tracker)
    {
        Gate::authorize('forceDelete', $tracker);

        try {

            DB::transaction(function () use ($tracker) {
                $tracker->forceDelete();

                if ($tracker->transactions()->onlyTrashed()->exists()) {
                    $tracker->transactions()->onlyTrashed()->forceDelete();
                }
            });
            
        } catch (\Throwable $e) {
            throw $e;
        }

        return ApiResponseHelper::successResponse(
            message: 'Tracker permanently deleted successfully.',
        );
    }
}