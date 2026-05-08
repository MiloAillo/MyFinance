<?php

namespace App\Http\Requests\API\V1\User;

use App\Models\User;
use App\Services\API\V1\AuthService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class UpdateProfileRequest extends FormRequest
{
    public ?User $user = null;
    public ?string $currentEmail = null;
    public ?string $newPassword = null;

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
        if ($this->routeIs('api.v1.users.update.verify.new-email')) {
            return [
                'key' => 'required|string',
            ];
        }

        return [
            'avatar' => $this->hasFile('avatar') ? 'sometimes|image|mimes:jpeg,png,jpg,webp|max:2048' : 'sometimes|string|max:4', // 2 MB
            'name' => 'sometimes|string|min:3|max:50',
            'email' => "sometimes|string|email|max:255|unique:users,email,{$this->user()->id}|unique:users,pending_email,{$this->user()->id}",
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
        ];
    }

    public function messages()
    {
        return [
            'email.unique' => 'Invalid email address.',
        ];
    }

    public function prepareForValidation()
    {
        if ($this->routeIs('api.v1.users.update.verify.new-email')) {
            if ($this->route('key')) {
                 $this->merge([
                    'key' => $this->route('key')
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
        if ($this->routeIs('api.v1.users.update.verify.new-email')) {
            $values = AuthService::make()->retrieveEncryptedCachedData("new_email_verification_from_verified_user", $this->safe()->key);
            
            if (empty($values) || !is_array($values)) {
                abort(422, 'Invalid credentials.');
            }

            $user = User::find($values['user_id']);
            $newEmail = $values['new_email'] ?? null;

            if (!$user) {
                abort(404, 'User not found.');

            } else if ($user->pending_email == null) {
                abort(422, 'No pending email to verify.');

            } else if ($user->pending_email !== $newEmail) {
                abort(422, 'Invalid email.');
            }

             $this->user = $user;
        }

        if ($this->routeIs('api.v1.users.update')) {
            $this->user = $this->user();

            if (!empty($this->input('new_password'))) {
                $this->newPassword = Hash::make($this->input('new_password'));
            }
        }

        if ($this->hasAny(['email', 'key', 'old_password'])) {
            $this->currentEmail = $this->user->getEmailForVerification();
        }
    }
}
