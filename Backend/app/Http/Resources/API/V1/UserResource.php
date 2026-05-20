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
    ];

    public $relationships = [
        'trackers' => TrackerResource::class,
        'transactions' => TransactionResource::class,
    ];

    public function toAttributes(Request $request)
    {
        $attributes = parent::toAttributes($request);
        $attributes['avatar'] = $this->resource->getAvatarUrlAttribute();

        return $attributes;
    }

    public function toLinks(Request $request)
    {
        $links = parent::toLinks($request);
        
        return $links;
    }

    public function toMeta(Request $request)
    {
        $meta = parent::toMeta($request);
        
        return $meta;
    }
}
