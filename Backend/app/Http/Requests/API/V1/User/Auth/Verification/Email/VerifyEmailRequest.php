<?php

namespace App\Http\Requests\API\V1\User\Auth\Verification\Email;

use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Http\FormRequest;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class VerifyEmailRequest extends FormRequest
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
            'id' => 'required|integer',
            'hash' => 'required|string',
        ];
    }

    public function prepareForValidation()
    {
        if ($this->route('id') && $this->route('hash')) {
            $this->merge([
                'id' => $this->route('id'),
                'hash' => $this->route('hash'),
            ]);
        } else {
            throw new UnprocessableEntityHttpException('Invalid credentials.');
        }
    }

    public function passedValidation()
    {
        try{

            $user = User::findOrFail($this->id);
            
        } catch (ModelNotFoundException $e) {
            throw new UnprocessableEntityHttpException('Invalid credentials.');
        }

        if (!hash_equals((string) $this->hash, sha1($user->getEmailForVerification()))) {
            throw new UnprocessableEntityHttpException('Invalid credentials');
        }

        if ($user->hasVerifiedEmail()) {
            throw new UnprocessableEntityHttpException('Email is already verified.');
        }

        $this->merge(['user' => $user]);
    }
}
