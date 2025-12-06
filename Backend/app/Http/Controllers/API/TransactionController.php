<?php

namespace App\Http\Controllers\API;

use App\Helpers\ResponseHelper;
use App\Http\Requests\GetTransactionRequest;
use App\Http\Requests\GetTransactionsByRangeRequest;
use App\Http\Requests\GetTransactionsWithPaginationRequest;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Models\Tracker;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(GetAllTransactionsRequest $request)
    {
        try {
            // $user = $request->user();

            // // base query
            // $query = Transaction::where('user_id', $user->id)
            //     ->with('tracker:id,name');

            // // search and filters
            // if ($request->has('search')) {
            //     $search = $request->search;
            //     $query->where(function($q) use ($search) {
            //         $q->where('name', 'like', "%{$search}%")
            //           ->orWhere('description', 'like', "%{$search}%");
            //     });
            // }

            // if ($request->has('type')) {
            //     $query->where('type', $request->type);
            // }

            // if ($request->has('name')) {
            //     $query->where('name', $request->name);
            // }

            // if ($request->has('tracker_id')) {
            //     $query->where('tracker_id', $request->tracker_id);
            // }

            // if ($request->has(['start_date', 'end_date'])) {
            //     $query->whereBetween('transaction_date', [
            //         $request->start_date, $request->end_date
            //     ]);
            // }

            // // sorting
            // $sortField = $request->get('sort_field', 'transaction_date');
            // $sortOrder = $request->get('sort_order', 'desc');

            // $allowedSortFields = ['transaction_date', 'amount', 'created_at'];
            // if (in_array($sortField, $allowedSortFields)) {
            //     $query->orderBy($sortField, $sortOrder);
            // }

            // // pagination: default 15 per page
            // $transactions = $query->paginate($request->get('per_page', 15));

            // SOWWY, BUT IM TOO LAZYY :D

            return ResponseHelper::successResponse(
                ['transactions' => $transactions],
                'Transactions fetched successfully.'
            );

        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Transaction fetch error', 'Failed to fetch transactions.');
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTransactionRequest $request, Transaction $transaction, Tracker $tracker)
    {
        try {
            $transaction = $request->all();

            DB::transaction(function () use ($tracker, &$transaction) {
                return $tracker->transactions()->create($transaction);
            });

            return ResponseHelper::createdResponse(
                ['transaction' => $transaction],
                'Transaction created successfully.'
            );
        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Transaction store error', 'Failed to create transaction.');
        }
    }

    public function paginate(GetTransactionsWithPaginationRequest $request, Tracker $tracker)
    {
        try {
            $page = $request->page;
            $transactionsPerPage = 10;

            $transactions = $tracker->transactions()
                ->where('user_id', $request->user()->id)
                ->with('tracker:id,name') // eager load tracker relationship, only returns trackers id and name
                ->orderBy('transaction_date', 'desc')
                ->paginate($transactionsPerPage, ['*'], 'page', $page);

            return ResponseHelper::successResponse(
                ['transactions' => $transactions],
                'Transactions fetched successfully.'
            );

        } catch (\Exception $e) {
            return ResponseHelper::logAndErrorResponse($e, 'Transaction fetch error', 'Failed to fetch transactions.');
        }
    }

    public function ranged(GetTransactionsByRangeRequest $request, Tracker $tracker)
    {
        try {
            $user = $request->user();
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            $transactions = $tracker->transactions()
                ->where('user_id', $user->id)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->with('tracker:id,name') // eager load tracker relationship, only returns trackers id and name
                ->orderBy('transaction_date', 'desc')
                ->get();

            return ResponseHelper::successResponse(
                ['transactions' => $transactions],
                'Transactions fetched successfully.'
            );

        } catch (\Exception $e) {
            ResponseHelper::logAndErrorResponse($e, 'Transaction fetch error', 'Failed to fetch transactions.');
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(GetTransactionRequest $request, Transaction $transaction)
    {
        try {
            $transaction->load('tracker');

            return response()->json([
                'response_code' => Response::HTTP_OK,
                'status' => 'success',
                'message' => 'Transaction fetched successfully.',
                'data' => $transaction
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            Log::error('Error fetching transaction: ' . $e->getMessage());

            return response()->json([
                'response_code' => Response::HTTP_INTERNAL_SERVER_ERROR,
                'status' => 'error',
                'message' => 'Failed to fetch transaction'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTransactionRequest $request, Transaction $transaction)
    {
        try {
            if ($transaction->user_id !== $request->user()->id) {
                return response()->json([
                    'response_code' => Response::HTTP_FORBIDDEN,
                    'status' => 'error',
                    'message' => 'Access denied'
                ], Response::HTTP_FORBIDDEN);
            }

            if ($request->has('tracker_id')) {
                $tracker = Tracker::where('id', $request->tracker_id)
                    ->where('user_id', $request->user()->id)
                    ->firstOrFail();
            }
            
            $transaction->update($request->validated());

            return response()->json([
                'response_code' => Response::HTTP_OK,
                'status' => 'success',
                'message' => 'Transaction updated successfully',
                'data' => $transaction->load('tracker:id,name')
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            Log::error('Transaction update error: ' . $e->getMessage());

            return response()->json([
                'response_code' => Response::HTTP_INTERNAL_SERVER_ERROR,
                'status' => 'error',
                'message' => 'Failed to update transaction'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Transaction $transaction)
    {
        try {
            if ($transaction->user_id !== $request->user()->id) {
                return response()->json([
                    'response_code' => Response::HTTP_FORBIDDEN,
                    'status' => 'error',
                    'message' => 'Access denied'
                ], Response::HTTP_FORBIDDEN);
            }

            $transaction->delete();

            return response()->json([
                'response_code' => Response::HTTP_OK,
                'status' => 'success',
                'message' => 'Transaction deleted successfully.'
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            Log::error('Transaction delete error: ' . $e->getMessage());

            return response()->json([
                'response_code' => Response::HTTP_INTERNAL_SERVER_ERROR,
                'status' => 'error',
                'message' => 'Failed to delete transaction.'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function search()
    {
        try {
            $user = request()->user();
            $search = request()->get('q');

            $transactions = Transaction::where('user_id', $user->id)
                ->where(function($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                })
                ->with('tracker:id,name')
                ->limit(15)
                ->get();

            return response()->json([
                'response_code' => Response::HTTP_OK,
                'status' => 'success',
                'message' => 'Serch results fetched successfully',
                'data' => $transactions
            ], Response::HTTP_OK);

        } catch (\Exception $e) {

            Log::error('Transaction search error: ' . $e->getMessage());

            return response()->json([
                'response_code' => Response::HTTP_INTERNAL_SERVER_ERROR,
                'status' => 'error',
                'message' => 'Failed to search transactions'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
