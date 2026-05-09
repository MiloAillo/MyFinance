<?php

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use App\Http\Resources\API\V1\TrackerResource;
use App\Http\Resources\API\V1\UserResource;

class TransactionResource extends BaseResource
{
    public $attributes = [
        'tracker_id',
        'name',
        'type',
        'amount',
        'description',
        'files',
        'date',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public $relationships = [
        'user' => UserResource::class,
        'tracker' => TrackerResource::class,
    ];

    public function toLinks(Request $request)
    {
        $links = parent::toLinks($request);

        $links['self'] = route('api.v1.transactions.show', $this->resource);
        // $links['tracker'] = route('api.v1.trackers.show', $this->resource->tracker);
        
        return $links;
    }
}
