<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Helpers\ApiResponseHelper;
use App\Http\Requests\API\V1\Tracker\IndexDeletedTrackerRequest;
use App\Http\Requests\API\V1\Tracker\IndexTrackersRequest;
use App\Http\Requests\API\V1\Tracker\ShowDeletedTrackerRequest;
use App\Http\Requests\API\V1\Tracker\ShowTrackerReportRequest;
use App\Http\Requests\API\V1\Tracker\ShowTrackerRequest;
use App\Http\Requests\API\V1\Tracker\StoreTrackerRequest;
use App\Http\Requests\API\V1\Tracker\UpdateTrackerRequest;
use App\Http\Resources\API\V1\TrackerResource;
use App\Models\Tracker;
use App\Services\API\V1\TrackerService;
use Carbon\Carbon;
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

        $trackers = QueryBuilder::for(Tracker::where('user_id', $request->user()->getKey()))
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

        $trackers = QueryBuilder::for(Tracker::onlyTrashed()->where('user_id', $request->user()->getKey()))
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
            ->allowedSorts('name', 'created_at', 'updated_at', 'deleted_at')
            ->defaultSort('-deleted_at')
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
                        'self' => route('api.v1.deleted.transactions.show', $id),
                        'tracker' => route('api.v1.deleted.trackers.show', $transaction['tracker_id'])
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
            data: new TrackerResource($tracker->refresh()),
        );
    }

    public function show(ShowTrackerRequest $request, Tracker $tracker)
    {
        $tracker = QueryBuilder::for($tracker->newQuery()->whereKey($tracker->getKey()))
            ->allowedFields('id', 'name', 'description', 'current_balance', 'created_at', 'updated_at')
            ->firstOrFail();

        return ApiResponseHelper::successResponse(
            message: 'Tracker retrieved successfully.',
            data: new TrackerResource($tracker),
        );
    }

    public function reports(ShowTrackerReportRequest $request, Tracker $tracker)
    {
        $days = $request->validated()['range']['days'];
        $now = Carbon::now();
        $rangeDataPresent = $now->copy()->subDays($days)->startOfDay()->toDateString();
        $rangeDataOld = $now->copy()->subDays(2 * $days)->startOfDay()->toDateString();

        $transactions = $tracker->transactions();
        $tracker = $tracker->newQuery()->whereKey($tracker->getKey());

        $report = DB::transaction(function () use ($tracker, $transactions, $rangeDataPresent, $rangeDataOld, $days) {
            $tracker->sharedLock()->first(['id']);

            $allTransactions = $transactions->sharedLock()
                ->whereIn('type', ['income', 'expense'])
                ->whereDate('date', '>=', $rangeDataOld)
                ->get(['id', 'amount', 'date', 'type']);

            // true = go to $presentTxs, false = go to $oldTxs
            $presentStart = Carbon::parse($rangeDataPresent)->startOfDay();
            
            [$presentTxs, $oldTxs] = $allTransactions->partition(function ($tx) use ($presentStart) {
                return Carbon::parse($tx->date)->startOfDay() >= $presentStart;
            });

            $presentIncomes  = $presentTxs->where('type', 'income');
            $presentExpenses = $presentTxs->where('type', 'expense');
            $oldIncomes      = $oldTxs->where('type', 'income');
            $oldExpenses     = $oldTxs->where('type', 'expense');

            $mapTx = fn($tx) => [
                'id'     => (string) $tx->id,
                'amount' => $tx->amount,
                'date'   => $tx->date,
            ];

            $formatAgg = fn($val) => number_format((float) ($val ?? 0), 2, '.', '');

            return [
                'data' => [
                    'time_range' => [
                        'in_days'             => (string) $days,
                        'present_range_start' => $rangeDataPresent,
                        'old_range_start'     => $rangeDataOld,
                    ],
                    'present' => [
                        'income' => [
                            'total'        => $formatAgg($presentIncomes->sum('amount')),
                            'max'          => $formatAgg($presentIncomes->max('amount')),
                            'transactions' => $presentIncomes->map($mapTx)->values()->all(),
                        ],
                        'expenses' => [
                            'total'        => $formatAgg($presentExpenses->sum('amount')),
                            'max'          => $formatAgg($presentExpenses->max('amount')),
                            'transactions' => $presentExpenses->map($mapTx)->values()->all(),
                        ],
                    ],
                    'old' => [
                        'income' => [
                            'total'        => $formatAgg($oldIncomes->sum('amount')),
                            'max'          => $formatAgg($oldIncomes->max('amount')),
                            'transactions' => $oldIncomes->map($mapTx)->values()->all(),
                        ],
                        'expenses' => [
                            'total'        => $formatAgg($oldExpenses->sum('amount')),
                            'max'          => $formatAgg($oldExpenses->max('amount')),
                            'transactions' => $oldExpenses->map($mapTx)->values()->all(),
                        ],
                    ]
                ]
            ];
        });

        return ApiResponseHelper::successResponse(
            message: 'Tracker reports generated successfully.',
            data: $report
        );
    }

    public function showDeleted(ShowDeletedTrackerRequest $request, Tracker $tracker)
    {
        $tracker = QueryBuilder::for($tracker->newQuery()->onlyTrashed()->whereKey($tracker->getKey()))
            ->allowedFields('id', 'name', 'description', 'current_balance', 'created_at', 'updated_at', 'deleted_at')
            ->firstOrFail();

        return ApiResponseHelper::successResponse(
            message: 'Deleted tracker retrieved successfully.',
            data: new TrackerResource($tracker),
        );
    }

    public function update(UpdateTrackerRequest $request, Tracker $tracker)
    {
        DB::transaction(fn() => $tracker->newQuery()->lockForUpdate()->whereKey($tracker->getKey())->update($request->validated()));

        return ApiResponseHelper::successResponse(
            message: 'Tracker updated successfully.',
            data: new TrackerResource($tracker->refresh()),
        );
    }

    public function delete(Request $request, Tracker $tracker)
    {
        Gate::authorize('delete', $tracker);

        DB::transaction(function () use ($tracker) {
            $tracker->newQuery()->lockForUpdate()->whereKey($tracker->getKey())->first(['id']);
            $tracker->transactions()->lockForUpdate()->get(['id']);

            $tracker->transactions()->delete();
            $tracker->update(['current_balance' => 0]);

            $tracker->delete();
        });

        return ApiResponseHelper::successResponse(
            message: 'Tracker deleted successfully.',
        );
    }

    public function restore(Request $request, Tracker $tracker)
    {
        Gate::authorize('restore', $tracker);
 
        DB::transaction(function () use ($tracker) {
            $tracker = $tracker->newQuery()->lockForUpdate()->onlyTrashed()->findOrFail($tracker->getKey());
            $tracker->transactions()->lockForUpdate()->onlyTrashed()->get(['id']);

            $tracker->restore();

            if ($tracker->transactions()->onlyTrashed()->restore() > 0) {
                $tracker->refresh();

                $totals = $tracker->transactions()
                ->selectRaw("
                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
                ")
                ->first();

                $totalIncome = $totals->total_income ?? 0;
                $totalExpenses = $totals->total_expense ?? 0;
                $totalBalance = $totalIncome - $totalExpenses;
                
                if ($totalBalance > 0) {
                    $tracker->increment('current_balance', $totalBalance);
                } elseif ($totalBalance < 0) {
                    $tracker->decrement('current_balance', abs($totalBalance));
                }
                
            } else {
                $tracker->update(['current_balance' => 0]);
            }
        });

        return ApiResponseHelper::successResponse(
            message: 'Tracker restored successfully. 
            All associated transactions have also been restored. 
            You may need to re-delete any transactions that you wish to keep deleted.',
        );
    }

    public function forceDelete(Request $request, Tracker $tracker)
    {
        Gate::authorize('forceDelete', $tracker);

        DB::transaction(function () use ($tracker) {
            $tracker->newQuery()->lockForUpdate()->onlyTrashed()->whereKey($tracker->getKey())->first(['id']);
            $tracker->transactions()->lockForUpdate()->onlyTrashed()->get(['id']);

            $tracker->transactions()->onlyTrashed()->forceDelete();
            $tracker->forceDelete();
        });

        return ApiResponseHelper::successResponse(
            message: 'Tracker permanently deleted successfully.
            All associated transactions have also been permanently deleted.
            You will not be able to recover any of these records.',
        );
    }
}