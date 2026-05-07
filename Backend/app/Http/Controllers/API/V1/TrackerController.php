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

        $trackers = QueryBuilder::for(Tracker::class)
            ->where('user_id', $request->user()->id)
            ->allowedIncludes(
                AllowedInclude::callback(
                    name: 'recent_transactions',
                    callback: fn($query) => $query->with(['transactions' => fn($q) => $q->latest('updated_at')->limit($transactionSize)]),
                    internalName: 'transactions'
                ),
            )
            ->allowedFields(
                'id', 'name', 'description', 'current_balance', 'created_at', 'updated_at',
                'transactions.id','transactions.amount', 'transactions.type'
            )
            ->allowedFilters('name', 'description')
            ->allowedSorts('name', 'created_at', 'updated_at')
            ->defaultSort('-updated_at')
            ->paginate($trackerSize);

        return ApiResponseHelper::successResponse(
            message: 'Trackers retrieved successfully.',
            data: TrackerResource::collection($trackers),
        );
    }

    public function indexDeleted(IndexDeletedTrackerRequest $request)
    {
        $validated = $request->validated();
        $transactionSize = $validated['transaction_size'];
        $trackerSize = $validated['size'];

        $trackers = QueryBuilder::for(Tracker::class)
            ->onlyTrashed()
            ->where('user_id', $request->user()->id)
            ->allowedIncludes(
                AllowedInclude::callback(
                    name: 'recent_transactions',
                    callback: fn($query) => $query->with(['transactions' => fn($q) => $q->onlyTrashed()->latest('updated_at')->limit($transactionSize)]),
                    internalName: 'transactions'
                ),
            )
            ->allowedFields(
                'id', 'name', 'description', 'current_balance', 'created_at', 'updated_at', 'deleted_at',
                'transactions.id','transactions.amount', 'transactions.type'
            )
            ->allowedFilters('name', 'description')
            ->allowedSorts('name', 'created_at', 'updated_at')
            ->defaultSort('-deleted_at')
            ->paginate($trackerSize);

        return ApiResponseHelper::successResponse(
            message: 'Deleted trackers retrieved successfully.',
            data: TrackerResource::collection($trackers),
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

            return ApiResponseHelper::successResponse(
                message: 'Tracker deleted successfully.',
            );
            
        } catch (\Throwable $e) {
            throw $e;
        }
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

            return ApiResponseHelper::successResponse(
                message: 'Tracker permanently deleted successfully.',
            );
            
        } catch (\Throwable $e) {
            throw $e;
        }
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

            return ApiResponseHelper::successResponse(
                message: 'Tracker restored successfully.',
            );

        } catch (\Throwable $e) {
            throw $e;
        }
    }
}