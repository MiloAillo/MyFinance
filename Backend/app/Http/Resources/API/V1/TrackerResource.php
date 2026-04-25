<?php

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
// use App\Http\Resources\API\V1\TransactionResource;
use App\Http\Resources\API\V1\UserResource;

class TrackerResource extends BaseResource
{
    public $attributes = [
        'name',
        'description',
    ];

    public $relationships = [
        'user' => UserResource::class,
        // 'transactions' => TransactionResource::class
    ];

    public function toAttributes(Request $request)
    {
        $attributes = parent::toAttributes($request);

        return $attributes;
    }

    public function toLinks(Request $request)
    {
        $links = parent::toLinks($request);

        $links['self'] = route('api.v1.trackers.show', $this->resource);
        // $links['transactions'] = route('api.v1.trackers.transactions.index', $this->resource);
        
        return $links;
    }

    public function toMeta(Request $request)
    {
        $meta = parent::toMeta($request);

        $meta['transaction_count'] = $this->getTotalTransactionsAttribute();
        $meta['current_balance'] = $this->getCurrentBalanceAttribute();
        
        return $meta;
    }
}
