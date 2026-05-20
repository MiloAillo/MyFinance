<?php

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use App\Http\Resources\API\V1\TransactionResource;
use App\Http\Resources\API\V1\UserResource;

class TrackerResource extends BaseResource
{
    public $attributes = [
        'name',
        'description',
        'current_balance',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public $relationships = [
        'user' => UserResource::class,
        'transactions' => TransactionResource::class
    ];

    public function toAttributes(Request $request)
    {
        $attributes = parent::toAttributes($request);

        return $attributes;
    }

    public function toLinks(Request $request)
    {
        $links = parent::toLinks($request);

        if ($this->resource->id) {
            $links['self'] = $this->resource->trashed()
                ? route('api.v1.deleted.trackers.show', $this->resource)
                : route('api.v1.trackers.show', $this->resource);
        }
        
        return $links;
    }

    public function toMeta(Request $request)
    {
        $meta = parent::toMeta($request);

        return $meta;
    }
}
