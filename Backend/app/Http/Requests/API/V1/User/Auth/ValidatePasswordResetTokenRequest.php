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
            'email' => 'required|email',
            'token' => 'required|string',
        ];
    }

    public function passedValidation()
    {
        $record = DB::table('password_reset_tokens')->where('email', $this->input('email'))->first();

        if (!$record ||
            !Hash::check($this->input('token'), $record->token) ||
            Carbon::parse($record->created_at)->addMinutes(config('auth.passwords.users.expire'))->isPast()){
                throw new UnprocessableEntityHttpException('Invalid credentials');
        }
    }
}
