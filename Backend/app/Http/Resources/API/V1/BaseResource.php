<?php

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class BaseResource extends JsonApiResource
{
    public function toLinks(Request $request)
    {
        return [
            //
        ];
    }

    public function toMeta(Request $request)
    {
        return [
            'api_version' => '1.x.x',
        ];
    }
}
