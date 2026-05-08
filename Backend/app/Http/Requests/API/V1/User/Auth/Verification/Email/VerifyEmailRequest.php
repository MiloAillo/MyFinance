<?php

namespace App\Http\Requests\API\V1\User\Auth\Verification\Email;

use App\Models\User;
use App\Services\API\V1\AuthService;
use Illuminate\Foundation\Http\FormRequest;

class VerifyEmailRequest extends FormRequest
{
    public User $user;
    public string $currentDeviceHash;

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
            'key' => 'required|string',
        ];
    }

    public function prepareForValidation()
    {
        if ($this->route('key')) {
            $this->merge([
                'key' => $this->route('key')
            ]);
        } else {
            abort(422, 'Invalid credentials.');
        }
    }

    public function passedValidation()
    {
        $key = $this->safe()->key;
        $userId = AuthService::make()->retrieveEncryptedCachedData("email_verification", $key);

        if (empty($userId)) {
            abort(422, 'Invalid credentials.');
        }
        
        $this->user = User::where('id', $userId)->first();

        if (!$this->user) {
            abort(404, 'User not found.');
        }

        if ($this->user->hasVerifiedEmail()) {
            abort(422, 'Email is already verified.');
        }

        $this->currentDeviceHash = AuthService::make()->hashDevice($this->user->id, $this->userAgent());
    }
}
