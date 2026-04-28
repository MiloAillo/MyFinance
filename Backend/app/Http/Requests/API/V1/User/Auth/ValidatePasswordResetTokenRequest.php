<?php

namespace App\Http\Requests\API\V1\User\Auth;

use App\Services\API\V1\AuthService;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'token' => 'required|string',
            'email' => 'required|email',
        ];
    }

    public function prepareForValidation()
    {
        $token = $this->route('token');
        $email = $this->route('email');

        if ($token && $email) {
            $this->merge([
                'token' => $token,
                'email' => $email
            ]);
        }
    }

    public function passedValidation()
    {
        if (AuthService::make()->isPasswordResetTokenValid($this->input('email'), $this->input('token'))) {
            throw new UnprocessableEntityHttpException('Invalid credentials');
        }
    }
}
