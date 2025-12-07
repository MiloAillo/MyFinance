<?php

namespace App\Http\Controllers\API;

use App\Helpers\ResponseHelper;
use App\Http\Requests\DeleteTrackerRequest;
use App\Http\Requests\GetAllTrackersRequest;
use App\Http\Requests\GetTrackerRequest;
use App\Http\Requests\GetTrackersBySearchRequest;
use App\Http\Requests\StoreTrackerRequest;
use App\Models\Tracker;
use App\Http\Requests\UpdateTrackerRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class TrackerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(GetAllTrackersRequest $request, Tracker $tracker)
    {
        try {
            // Fetch trackers with the latest (3) transactions for the authenticated user
            $trackers = $tracker
            ->with(['transactions' => function ($query) {
                $query->latest()->limit(3);}])
            ->where('user_id', $request->user()->id)->get();
            

            return ResponseHelper::successResponse(
                ['trackers' => $trackers],
                'Trackers fetched successfully.'
            );

        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Tracker index error', 'Failed to fetch trackers.');
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTrackerRequest $request)
    {
        try {
            $tracker = array_merge($request->validated(), ['user_id' => $request->user()->id]);
            
            DB::transaction(function () use (&$tracker) {
                return Tracker::create($tracker);
            });

            return ResponseHelper::createdResponse(
                ['tracker' => $tracker],
                'Tracker created successfully.'
            );

        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Tracker store error', 'Failed to create tracker.');
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(GetTrackerRequest $request, Tracker $tracker)
    {
        try {
            if ($tracker->user_id !== $request->user()->id) {
                return ResponseHelper::forbiddenResponse('Access denied.');
            }

            // Fetch the tracker with the latest (7) transactions for the authenticated user
            $tracker = $tracker->with(['transactions' => function ($query) {
                $query->latest()->limit(7);
            }])->findOrFail($tracker->id);

            $tracker->current_balance = $tracker->current_balance;

            return ResponseHelper::successResponse(
                ['tracker' => $tracker],
                'Tracker fetched successfully.'
            );

        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Tracker show error', 'Failed to fetch tracker.');
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTrackerRequest $request, Tracker $tracker)
    {
        try {
            if ($tracker->user_id !== $request->user()->id) {
                return ResponseHelper::forbiddenResponse('Access denied.');
            }

            $tracker->update($request->validated());

            return ResponseHelper::successResponse(
                ['tracker' => $tracker],
                'Tracker updated successfully.'
            );
        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Tracker update error', 'Failed to update tracker.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(DeleteTrackerRequest $request, Tracker $tracker)
    {
        try {
            if ($tracker->user_id !== $request->user()->id) {
                return ResponseHelper::forbiddenResponse('Access denied.');
            }

            DB::transaction(function () use ($tracker) {
                $tracker->transactions()->delete();
                $tracker->delete();
            });

            return ResponseHelper::successResponse(
                null,
                'Tracker deleted successfully.'
            );
        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Tracker destroy error', 'Failed to delete tracker.');
        }
    }

    public function search(GetTrackersBySearchRequest $request, Tracker $tracker)
    {
        try {
            $user = $request->user();
            $search = $request->get('q');

            $trackers = $tracker
            ->with(['transactions' => function ($query) {
                $query->latest()->limit(3);}])
            ->where('user_id', $user->id)
            ->where(function($query) use ($search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->get();

            return ResponseHelper::successResponse(
                ['trackers' => $trackers],
                'Trackers fetched successfully.'
            );
        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Tracker search error', 'Failed to search trackers.');
        }
    }
}