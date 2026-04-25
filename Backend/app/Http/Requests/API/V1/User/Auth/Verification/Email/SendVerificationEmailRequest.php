<?php

namespace App\Http\Requests\API\V1\User\Auth\Verification\Email;

use Illuminate\Foundation\Http\FormRequest;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class SendVerificationEmailRequest extends FormRequest
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
            //
        ];
    }

    public function passedValidation()
    {
        $user = $this->user();
        
        if ($user->email_verified_at) {
            throw new UnprocessableEntityHttpException('Email is already verified.');
        }

        $this->merge(['user' => $user]);
    }
}
