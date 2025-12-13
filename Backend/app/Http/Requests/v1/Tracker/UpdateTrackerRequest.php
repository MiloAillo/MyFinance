<?php

namespace App\Http\Requests\v1;

use Illuminate\Http\Exceptions\HttpResponseException;
use App\Helpers\ResponseHelper;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTrackerRequest extends FormRequest
{
    private $databaseFields = [
        'user_id',
        'name',
        'description',
        'currency',
        'initial_balance',
        'is_active'
    ];

    public function onlyDatabaseFields()
    {
        return $this->only($this->databaseFields);
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $tracker = $this->route('tracker');
        $user = $this->user();

        return $tracker && $user->id === $tracker->user_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:100',
            'description' => 'nullable|string|max:500',
            'currency' => 'sometimes|string|size:3',
            'initial_balance' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean'
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages()
    {
        return [
            'name.string' => 'The tracker name must be a string.',
            'name.max' => 'The tracker name cannot be more than 100 characters.',
            'description.string' => 'The description must be a string.',
            'description.max' => 'The description cannot be more than 500 characters.',
            'currency.string' => 'The currency must be a string.',
            'currency.size' => 'The currency must be exactly :size characters.',
            'initial_balance.numeric' => 'The initial balance must be a number.',
            'initial_balance.min' => 'The initial balance must be at least :min.',
            'is_active.boolean' => 'The is_active field must be true or false.',
        ];
    }

    public function withValidator(Validator $validator)
    {
        $validator->after(function ($validator) {
            if (!$validator->failed()) {
                $this->merge(['user_id' => $this->user()->id]);
            }
        });
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            ResponseHelper::validationErrorResponse($validator)
        );
    }
}
