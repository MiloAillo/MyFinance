<?php

namespace App\Http\Requests\API\V1\Tracker;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTrackerRequest extends FormRequest
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
            'id' => 'required|exists:trackers,id',
            'name' => 'sometimes|string|max:100',
            'description' => 'sometimes|nullable|string|max:500',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'id' => $this->route('tracker')->id,
        ]);
    }
}
