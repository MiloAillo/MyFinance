<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GetTransactionsWithPaginationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->id === $this->route('tracker')->user_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            //
        ];
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'page' => $this->get('page', 1),
            'per_page' => $this->get('per_page', 10),
            'order' => $this->get('order', 'desc'),
            'type' => $this->get('type', null),
        ]);
    }
}
