<?php

namespace App\Http\Requests\v1;

use App\Helpers\ResponseHelper;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class GetTransactionsWithPaginationRequest extends FormRequest
{
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
