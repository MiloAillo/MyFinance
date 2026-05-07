<?php

namespace App\Http\Requests\API\V1\Tracker;

use Illuminate\Contracts\Validation\ValidationRule;

class IndexDeletedTrackerRequest extends IndexTrackersRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('viewAnyDeleted');
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

    public function prepareForValidation()
    {
        $this->merge([
            'transaction_size' => $this->input('transaction_size', 5),
            'size' => $this->input('size', 15),
            'page' => $this->input('page', 1),
        ]);
    }
}
