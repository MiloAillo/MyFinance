<?php

namespace App\Http\Controllers\API\V1;

use App\Exceptions\API\V1\ModelHasNotBeenSoftDeletedException;
use App\Http\Helpers\ApiResponseHelper;
use App\Http\Requests\API\V1\Tracker\IndexTrackersRequest;
// use App\Http\Requests\API\V1\Tracker\ShowTrackerRequest;
use App\Http\Requests\API\V1\Tracker\StoreTrackerRequest;
use App\Http\Requests\API\V1\Tracker\UpdateTrackerRequest;
use App\Http\Resources\API\V1\TrackerResource;
use App\Models\Tracker;
// use App\Services\API\V1\TrackerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TrackerController extends Controller
{
    // public function __construct(protected TrackerService $trackerService)
    // {
    //     $this->trackerService = $trackerService;
    // }

    public function index(IndexTrackersRequest $request)
    {
        $validated = $request->validated();
        $transaction_size = $validated['transaction_size'];

        $trackers = Tracker::with(['transactions' => function ($query) use ($transaction_size) {
            $query->latest()->limit($transaction_size); }])
            ->where('user_id', $validated['user_id'])
            ->latest()
            ->paginate(perPage: $validated['size'], page: $validated['page'],);

        return ApiResponseHelper::successResponse(
            message: 'Trackers retrieved successfully.',
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

    public function show(Request $request, Tracker $tracker)
    {
        // rule for auth, dont forget to add in policy

        return ApiResponseHelper::successResponse(
            message: 'Tracker retrieved successfully.',
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

    public function destroy(Request $request, Tracker $tracker)
    {
        // rule for auth, dont forget to add in policy

        try {

            DB::transaction(function () use ($tracker) {
                if ($tracker->isForceDeletable()) {
                    $tracker->forceDelete();

                    if ($tracker->transactions()->onlyTrashed()->exists()) {
                        $tracker->transactions()->onlyTrashed()->forceDelete();
                    }

                } else {
                    $tracker->delete();

                    if ($tracker->transactions()->exists()) {
                        $tracker->transactions()->delete();
                    }
                }
            });

            return ApiResponseHelper::successResponse(
                message: 'Tracker deleted successfully.',
            );
            
        } catch (\Exception $e) {
            throw $e;
        }
    }

    public function restore(Request $request, Tracker $tracker)
    {
        // rule for auth, dont forget to add in policy
        
        try {
                
            DB::transaction(function () use ($tracker) {
                if ($tracker->trashed()) {
                    $tracker->restore();

                    if ($tracker->transactions()->onlyTrashed()->exists()) {
                        $tracker->transactions()->onlyTrashed()->restore();
                    }
                } else {
                    throw new ModelHasNotBeenSoftDeletedException('Tracker has not been soft deleted, cannot be restored.');
                }
            });

            return ApiResponseHelper::successResponse(
                message: 'Tracker restored successfully.',
            );

        } catch (\Exception $e) {
            throw $e;
        }
    }
}