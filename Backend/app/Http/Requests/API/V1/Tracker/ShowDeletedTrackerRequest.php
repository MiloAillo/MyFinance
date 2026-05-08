<?php

namespace App\Http\Requests\API\V1\Tracker;

use Illuminate\Contracts\Validation\ValidationRule;

class ShowDeletedTrackerRequest extends ShowTrackerRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('viewDeleted', $this->route('tracker'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_merge_recursive(parent::rules(), [
            //
        ]);
    }
}
