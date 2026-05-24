<?php

namespace App\Notifications\API\V1\User\Auth;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class ResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public string $credentials, public int $expiresInMinutes)
    {
        $this->credentials = $credentials;
        $this->expiresInMinutes = $expiresInMinutes;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $credentials = $this->credentials;
        $expires = now()->addMinutes($this->expiresInMinutes);
        $backendUrl = URL::temporarySignedRoute('api.v1.auth.password-resets.update', $expires, ['credentials' => $credentials]);
        $queryParams = Str::after($backendUrl, '?');
        $encodedCredentials = rawurlencode($credentials);

        $frontendUrl = config('app.frontend_url') . "/password-resets/{$encodedCredentials}?{$queryParams}";

        return (new MailMessage)
            ->subject('Reset Your Password - ' . config('app.name'))
            ->view('emails.auth.reset-password', [
                'actionUrl' => $frontendUrl,
                'expiration' => $this->expiresInMinutes,
            ]);
    }
}
