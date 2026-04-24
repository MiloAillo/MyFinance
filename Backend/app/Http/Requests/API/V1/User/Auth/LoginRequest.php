<?php

namespace App\Http\Requests\API\V1\User\Auth;

use App\Models\User;
use App\Services\API\V1\AuthService;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class LoginRequest extends BaseRequest
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
        $data['user'] = User::where('email', $this->input('email'))->first();
        $data['currentDeviceHash'] = hash('sha256', AuthService::make()->hashDevice($data['user']->id, $this->userAgent()));

        if ($this->routeIs('api.v1.auth.login') && (!$data['user'] || !Hash::check($this->input('password'), $data['user']->password))) {
            throw new UnprocessableEntityHttpException('Invalid credentials');
        }

        if ($this->routeIs('api.v1.auth.login.new-device')) {
            $hash = $this->route('hash');

            if (!hash_equals($hash, $data['currentDeviceHash'])) {
                throw new UnprocessableEntityHttpException('Invalid credentials.');
            }
        }

        $this->merge($data);
    }
}
