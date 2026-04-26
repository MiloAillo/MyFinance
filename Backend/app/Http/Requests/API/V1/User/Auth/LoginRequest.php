<?php

namespace App\Http\Requests\API\V1\User\Auth;

use App\Models\User;
use App\Services\API\V1\AuthService;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class LoginRequest extends BaseRequest
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
            'email' => 'required|email|exists:users,email',
            'password' => [ $this->routeIs('api.v1.auth.login.new-device') ? 'sometimes' : 'required', 'string' ],
        ];
    }

    public function messages()
    {
        return array_merge_recursive(parent::messages(), [
            //
        ]);
    }

    public function prepareForValidation()
    {
        if ($this->routeIs('api.v1.auth.login.new-device') && $this->route('email')) {
            $this->merge([
                'email' => $this->route('email'),
            ]);
        }
    }

    protected function passedValidation()
    {
        $this->user = User::where('email', $this->input('email'))->first();
        $this->currentDeviceHash = AuthService::make()->hashDevice($this->user->id, $this->userAgent());

        if ($this->routeIs('api.v1.auth.login') && (!$this->user || !Hash::check($this->input('password'), $this->user->password))) {
            throw new UnprocessableEntityHttpException('Invalid credentials');
        }

        if ($this->routeIs('api.v1.auth.login.new-device')) {
            $hash = $this->route('hash');

            if (!hash_equals($hash, $this->currentDeviceHash)) {
                throw new UnprocessableEntityHttpException('Invalid credentials.');
            }
        }
    }
}
