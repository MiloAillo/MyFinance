<?php

namespace App\Http\Requests\API\V1\User\Auth;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class LoginRequest extends FormRequest
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
            'email' => 'required|email',
            'password' => $this->routeIs('api.v1.auth.login.new-device') ? 'sometimes' : 'required|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages()
    {
        return [];
    }

    protected function passedValidation()
    {
        $user = User::where('email', $this->input('email'))->first();
        $data = ['user' => $user];
        $hash = $this->route('hash');
        $currentDeviceHash = hash('sha256', "$user->id|{$this->userAgent()}");

        if ($this->routeIs('api.v1.auth.login') && (!$user || !Hash::check($this->input('password'), $user->password))) {
            throw new UnprocessableEntityHttpException('Invalid credentials');
        }

        if ($this->routeIs('api.v1.auth.login.new-device')) {
            if (!hash_equals($hash, $currentDeviceHash)) {
                throw new UnprocessableEntityHttpException('Invalid credentials.');
            }

            $data['hash'] = $hash;
        }

        $this->merge($data);
    }
}
