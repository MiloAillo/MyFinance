<?php

namespace App\Http\Controllers\API;

use App\Helpers\ResponseHelper;
use App\Http\Requests\DeleteTrackerRequest;
use App\Http\Requests\GetAllTrackersRequest;
use App\Http\Requests\GetAllTransactionsByTracker;
use App\Http\Requests\GetAllTransactionsByTrackerRequest;
use App\Http\Requests\GetTrackerRequest;
use App\Http\Requests\GetTrackersBySearchRequest;
use App\Http\Requests\StoreTrackerRequest;
use App\Models\Tracker;
use App\Http\Requests\UpdateTrackerRequest;
use Illuminate\Support\Facades\DB;

class TrackerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(GetAllTrackersRequest $request)
    {
        try {
            $trackers = Tracker::with(['transactions' => function ($query) {
                $query->latest()->limit(3);}]) // Eager load latest 3 transactions
            ->where('user_id', $request->user()->id)
            ->get();

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
            $tracker = $request->onlyDatabaseFields();
            
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
            
            $tracker = $tracker->load(['transactions' => function ($query) {
                $query->latest()->limit(7); // Eager load latest 7 transactions
            }]);

            return ResponseHelper::successResponse(
                ['tracker' => $tracker],
                'Tracker fetched successfully.'
            );

        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Tracker show error', 'Failed to fetch tracker.');
        }
    }

    public function allTransactions(GetAllTransactionsByTrackerRequest $request, Tracker $tracker)
    {
        try {
            $tracker = $tracker->load(['transactions' => function ($query) {
                $query->latest();
            }]);

            return ResponseHelper::successResponse(
                ['tracker' => $tracker],
                'Tracker transactions fetched successfully.'
            );
        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Tracker transactions fetch error', 'Failed to fetch tracker transactions.');
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTrackerRequest $request, Tracker $tracker)
    {
        try {
            $tracker->update($request->onlyDatabaseFields());

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
            $tracker->delete();

            return ResponseHelper::successResponse(
                null,
                'Tracker deleted successfully.'
            );
        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Tracker destroy error', 'Failed to delete tracker.');
        }
    }

    public function search(GetTrackersBySearchRequest $request)
    {
        try {
            $search = $request->get('q');

            $trackers = Tracker::with(['transactions' => function ($query) {
                $query->latest()->limit(3);}]) // Eager load latest 3 transactions
            ->where('user_id', $request->user()->id)
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