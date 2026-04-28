<?php

namespace App\Http\Requests\API\V1\User\Auth;

use App\Models\User;
use App\Services\API\V1\AuthService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class ResetPasswordRequest extends BaseRequest
{
    public User $user;

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
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ]
        ];
    }

    public function messages()
    {
        return array_merge(parent::messages(), [
            //
        ]);
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
        if (!AuthService::make()->isPasswordResetTokenValid($this->input('email'), $this->input('token'))) {
            throw new UnprocessableEntityHttpException('Invalid credentials');
        }

        $this->user = User::where('email', $this->input('email'))->first();
    }
}
