<?php

namespace App\Http\Requests\API\V1\User\Auth;

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
        $tokenRecord = DB::table('password_reset_tokens')->where('email', $this->input('email'))->first();

        if (!$tokenRecord ||
            !Hash::check($this->input('token'), $tokenRecord->token) ||
            Carbon::parse($tokenRecord->created_at)->addMinutes(config('auth.passwords.users.expire'))->isPast()){
                throw new UnprocessableEntityHttpException('Invalid credentials');
        }
    }
}
