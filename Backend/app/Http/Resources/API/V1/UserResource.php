<?php

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use App\Http\Resources\API\V1\TrackerResource;
use App\Http\Resources\API\V1\TransactionResource;

class UserResource extends BaseResource
{
    public $attributes = [
        'name',
        'email',
        'email_verified_at',
        'avatar',
    ];

    public $relationships = [
        'trackers' => TrackerResource::class,
        'transactions' => TransactionResource::class,
    ];

    // public function toLinks(Request $request)
    // {
    //     return array_merge_recursive(
    //         parent::toLinks($request), 
    //         [
    //             'trackers' => route('api.v1.users.trackers.index', $this->resource),
    //             'transactions' => route('api.v1.users.transactions.index', $this->resource),
    //         ]
    //     );
    // }

    // public function toMeta(Request $request)
    // {
    //     return array_merge_recursive(
    //         parent::toMeta($request),
    //         [
    //             'tracker_count' => $this->trackers()->count(),
    //             'transaction_count' => $this->transactions()->count(),
    //         ]
    //     );
    // }
}
