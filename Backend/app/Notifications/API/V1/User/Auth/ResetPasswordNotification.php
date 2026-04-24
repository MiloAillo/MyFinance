<?php

namespace App\Notifications\API\V1\User\Auth;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class ResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public $token)
    {
        $this->token = $token;
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
        // Frontend route
        // $url = config('app.frontend_url') . '/reset-password?' . http_build_query([
        // 'token' => $this->token,
        // 'email' => $notifiable->email
        // ]);

        // Backend Route
        // $url = config('app.url') . '/auth/password-resets?credentials=' . Crypt::encrypt(http_build_query([
        //     'token' => $this->token,
        //     'email' => $notifiable->getEmailForPasswordReset(),
        // ]));

        $url = URL::temporarySignedRoute(
            'api.v1.auth.password-resets.update',
            now()->addMinutes(config('auth.passwords.users.expire')),
            ['token' => $this->token, 'email' => $notifiable->getEmailForPasswordReset()]
        );

        return (new MailMessage)
            ->subject('Reset Your Password - ' . config('app.name'))
            ->greeting('Hello!')
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->action('Reset Password', $url)
            ->line('This password reset link will expire in ' . config('auth.passwords.users.expire') . ' minutes.')
            ->line('If you did not request a password reset, no further action is required.')
            ->salutation('Regards, ' . config('app.name'));
    }
}
