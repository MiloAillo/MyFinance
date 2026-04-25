<?php

namespace App\Http\Requests\API\V1\Tracker;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class IndexTrackersRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'transaction_size' => 'sometimes|integer|min:1',
            'size' => 'sometimes|integer|min:1',
            'page' => 'sometimes|integer|min:1',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'user_id' => $this->user()->id,
            'transaction_size' => $this->input('transaction_size', 7),
            'size' => $this->input('size', 10),
            'page' => $this->input('page', 1),
        ]);
    }
}
