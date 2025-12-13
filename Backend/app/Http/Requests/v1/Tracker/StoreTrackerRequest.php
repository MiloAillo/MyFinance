<?php

namespace App\Http\Requests\v1;

use Illuminate\Http\Exceptions\HttpResponseException;
use App\Helpers\ResponseHelper;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreTrackerRequest extends FormRequest
{
    private $databaseFields = [
        'user_id',
        'name',
        'description',
        'initial_balance',
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
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'initial_balance' => 'required|numeric|min:0',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages()
    {
        return [
            'name.required' => 'The tracker name is required.',
            'name.string' => 'The tracker name must be a string.',
            'name.max' => 'The tracker name cannot be more than 100 characters.',
            'description.string' => 'The description must be a string.',
            'description.max' => 'The description cannot be more than 500 characters.',
            'initial_balance.required' => 'The initial balance is required.',
            'initial_balance.numeric' => 'The initial balance must be a number.',
            'initial_balance.min' => 'The initial balance must be at least :min.',
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
