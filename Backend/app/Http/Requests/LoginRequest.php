<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

;
use Symfony\Component\HttpFoundation\Response;

class LoginRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => 'required|email',
            'password' => 'required|string',
        ];
    }

    // public function messages()
    // {
    //     return [
    //         'email.required' => 'Email is required',
    //         'email.email' => 'Please enter a valid email address',
    //         'password' => 'Password is required'
    //     ];
    // }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'response_code' => Response::HTTP_UNPROCESSABLE_ENTITY,
                'status' => 'error',
                'errors' => $validator->errors()

            ], Response::HTTP_UNPROCESSABLE_ENTITY)
        );
    }
}
