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
        'date',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public $relationships = [
        'user' => UserResource::class,
        'tracker' => TrackerResource::class,
        'attachments' => AttachmentResource::class,
    ];

    public function toLinks(Request $request)
    {
        $links = parent::toLinks($request);

        if ($this->resource->id) {
            $links['self'] = $this->resource->trashed()
                ? route('api.v1.deleted.transactions.show', $this->resource)
                : route('api.v1.transactions.show', $this->resource);
        }
        
        if ($this->relationLoaded('tracker')) {
            $isTrackerTrashed = optional($this->resource->tracker)->trashed() ?? false;
            $links['tracker'] = $isTrackerTrashed
                ? route('api.v1.deleted.trackers.show', $this->resource->tracker_id)
                : route('api.v1.trackers.show', $this->resource->tracker_id);
        }
        
        return $links;
    }
}
