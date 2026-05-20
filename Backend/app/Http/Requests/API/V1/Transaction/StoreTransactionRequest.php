<?php

namespace App\Http\Requests\API\V1\Transaction;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', $this->route('tracker'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'tracker_id' => 'required|exists:trackers,id',
            'name' => 'required|string|max:50',
            'type' => 'required|in:income,expense',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'date' => 'required|date',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages()
    {
        return [];
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'date' => $this->input('date', now()->toDateTimeString()),
            'user_id' => $this->user()->id,
            'tracker_id' => $this->route('tracker')->id,
        ]);
    }
}
