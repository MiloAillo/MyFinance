<?php

namespace App\Http\Requests;

use Illuminate\Http\Exceptions\HttpResponseException;
use App\Helpers\ResponseHelper;
use Carbon\Traits\Timestamp;
use DateTime;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:50',
            'type' => ['required', Rule::in(['income', 'expense'])],
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:102400', // max 100MB
            'transaction_date' => 'required|date',
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
        if ($this->hasFile('image')) {
            $file = $this->file('image');
            $name = time() . '_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
            $file->storeAs('transactions/'.'user_id:'.$this->user()->id.'/tracker_id:'.$this->route('tracker')->id, $name, 'public');
            $image = 'transactions/'.'user_id:'.$this->user()->id. '/tracker_id:' . $this->route('tracker')->id . '/' . $name;
        } else {
            $image = null;
        }

        $this->merge([
            'user_id' => $this->user()->id,
            'tracker_id' => $this->route('tracker')->id,
            'image' => $image,
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
