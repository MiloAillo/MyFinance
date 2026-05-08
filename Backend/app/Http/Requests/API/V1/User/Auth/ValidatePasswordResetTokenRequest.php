<?php

namespace App\Http\Requests\API\V1\User\Auth;

use App\Services\API\V1\AuthService;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class ValidatePasswordResetTokenRequest extends FormRequest
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
            'token' => 'required|string',
            'email' => 'required|email',
        ];
    }

    public function withValidator(Validator $validator)
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->any()) {
                abort (422, 'Invalid credentials');
            }
        });
    }

    public function prepareForValidation()
    {
        $encryptedToken = $this->route('credentials');
        $decryptedData = AuthService::make()->decryptPasswordResetToken($encryptedToken);
        
        $this->merge($decryptedData);
    }

    public function passedValidation()
    {
        $email = $this->safe()->email;
        $token = $this->safe()->token;
        
        if (!AuthService::make()->isPasswordResetTokenValid($email, $token)) {
            abort(422, 'Invalid credentials');
        }
    }
}
