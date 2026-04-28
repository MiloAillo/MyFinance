<?php

namespace App\Http\Requests\API\V1\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class UpdateProfileRequest extends FormRequest
{
    public ?string $newPassword = null;
    public ?string $currentEmail = null;

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
            'avatar' => $this->hasFile('avatar') ? 'sometimes|image|mimes:jpeg,png,jpg,webp|max:2048' : 'sometimes|string|max:4', // 2 MB
            'name' => 'sometimes|string|min:3|max:50',
            'email' => [
                'sometimes',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($this->user()->id),
                Rule::unique('users', 'pending_email')->ignore($this->user()->id),
            ],
            'old_password' => 'sometimes|required_with:new_password|current_password',
            'new_password' => [
                'sometimes',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ],
            'id' => $this->routeIs('api.v1.users.update.verify.new-email') ? 'required|exists:users,id' : 'prohibited',
            'hash' => $this->routeIs('api.v1.users.update.verify.new-email') ? 'required|string' : 'prohibited',
        ];
    }

    public function prepareForValidation()
    {
        if ($this->routeIs('api.v1.users.update.verify.new-email')) {
            if ($this->route('id') && $this->route('hash')) {
                $this->merge([
                    'id' => $this->route('id'),
                    'hash' => $this->route('hash'),
                ]);
            }
        }

        if ($this->routeIs('api.v1.users.update')) {
            if (is_string($this->input('avatar')) && $this->input('avatar') !== 'null') {
                throw new UnprocessableEntityHttpException("Invalid avatar data. To remove the avatar, set the value to 'null'.");
            }
        }
    }

    public function passedValidation()
    {
        $user = $this->user();
        if ($this->hasAny(['email', 'id', 'old_password'])) {
            $this->currentEmail = $user->getEmailForVerification();
        }

        if ($this->routeIs('api.v1.users.update.verify.new-email')) {
            if ($user->pending_email == null) {
                throw new UnprocessableEntityHttpException('No pending email to verify.');
            }
            
            if (empty($this->hash) ||
                !hash_equals($this->hash, sha1($user->pending_email))) {
                throw new UnprocessableEntityHttpException('Invalid credentials.');
            }
        }

        if ($this->routeIs('api.v1.users.update')) {
            if (!empty($this->input('new_password'))) {
                $this->newPassword = Hash::make($this->input('new_password'));
            }
        }
    }
}
