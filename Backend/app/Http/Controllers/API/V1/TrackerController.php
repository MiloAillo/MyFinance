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

            $transactions = $transactions->whereIn('type', ['income', 'expense'])
                ->whereDate('date', '>=', $rangeDataOld)
                ->sharedLock()
                ->get(['id', 'amount', 'date', 'type']);

            $incomeFilter  = $transactions->where('type', 'income');
            $expenseFilter = $transactions->where('type', 'expense');

            $presentIncomes  = $incomeFilter->where('date', '>=', $rangeDataPresent)->values();
            $presentExpenses = $expenseFilter->where('date', '>=', $rangeDataPresent)->values();

            $totalPresentIncome   = $presentIncomes->sum('amount');
            $totalPresentExpenses = $presentExpenses->sum('amount');
            $maxPresentIncome     = $presentIncomes->max('amount');
            $maxPresentExpense    = $presentExpenses->max('amount');

            $oldIncomes  = $incomeFilter->where('date', '>=', $rangeDataOld)->where('date', '<', $rangeDataPresent)->values();
            $oldExpenses = $expenseFilter->where('date', '>=', $rangeDataOld)->where('date', '<', $rangeDataPresent)->values();

            $totalOldIncome   = $oldIncomes->sum('amount');
            $totalOldExpenses = $oldExpenses->sum('amount');
            $maxOldIncome     = $oldIncomes->max('amount');
            $maxOldExpense    = $oldExpenses->max('amount');

            return [
                'data' => [
                    'time_range' => [
                        'in_days' => (string) $days,
                        'present_range_start' => $rangeDataPresent,
                        'old_range_start' => $rangeDataOld,
                    ],
                    'present' => [
                        'income' => [
                            'total' => !empty($totalPresentIncome) ? (string) $totalPresentIncome : '0.00',
                            'max' => !empty($maxPresentIncome) ? (string) $maxPresentIncome : '0.00',
                            'transactions' => $presentIncomes->map(fn($income) => [
                                'id' => (string) $income->id,
                                'amount' => (string) $income->amount,
                                'date' => $income->date->toDateString(),
                            ])->values()->all(),
                        ],
                        'expenses' => [
                            'total' => !empty($totalPresentExpenses) ? (string) $totalPresentExpenses : '0.00',
                            'max' => !empty($maxPresentExpense) ? (string) $maxPresentExpense : '0.00',
                            'transactions' => $presentExpenses->map(fn($expense) => [
                                'id' => (string) $expense->id,
                                'amount' => (string) $expense->amount,
                                'date' => $expense->date->toDateString(),
                            ])->values()->all(),
                        ],
                    ],
                    'old' => [
                        'income' => [
                            'total' => !empty($totalOldIncome) ? (string) $totalOldIncome : '0.00',
                            'max' => !empty($maxOldIncome) ? (string) $maxOldIncome : '0.00',
                            'transactions' => $oldIncomes->map(fn($income) => [
                                'id' => (string) $income->id,
                                'amount' => (string) $income->amount,
                                'date' => $income->date->toDateString(),
                            ])->values()->all(),
                        ],
                        'expenses' => [
                            'total' => !empty($totalOldExpenses) ? (string) $totalOldExpenses : '0.00',
                            'max' => !empty($maxOldExpense) ? (string) $maxOldExpense : '0.00',
                            'transactions' => $oldExpenses->map(fn($expense) => [
                                'id' => (string) $expense->id,
                                'amount' => (string) $expense->amount,
                                'date' => $expense->date->toDateString(),
                            ])->values()->all(),
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
            $tracker->transactions()->lockForUpdate()->exists();
            $tracker->newQuery()->lockForUpdate()->whereKey($tracker->getKey())->exists();

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
            $tracker->transactions()->lockForUpdate()->onlyTrashed()->exists();
            $tracker = $tracker->newQuery()->lockForUpdate()->onlyTrashed()->findOrFail($tracker->getKey());

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
            $tracker->transactions()->lockForUpdate()->onlyTrashed()->exists();
            $tracker->newQuery()->lockForUpdate()->onlyTrashed()->whereKey($tracker->getKey())->exists();

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