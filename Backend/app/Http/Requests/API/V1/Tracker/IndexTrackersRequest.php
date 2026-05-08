<?php

namespace App\Http\Requests\API\V1\Tracker;

use App\Models\Tracker;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class IndexTrackersRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', Tracker::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'transaction_size' => 'sometimes|integer|min:1|max:15',
            'size' => 'sometimes|integer|min:1|max:25',
            'page' => 'sometimes|integer|min:1',
            'include.*' => 'sometimes|string',
            'fields' => 'sometimes|array',
            'fields.*' => 'sometimes|string',
            'filter' => 'sometimes|array',
            'filter.name' => 'sometimes|string|max:255',
            'filter.description' => 'sometimes|string|max:255',
            'sort' => 'sometimes|string',
        ];
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
