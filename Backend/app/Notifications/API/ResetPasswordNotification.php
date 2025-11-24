<?php

namespace App\Notifications\API;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public $token;

    /**
     * Create a new notification instance.
     */
    public function __construct($token)
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
        // Generate the password reset URL
        $url = config('app.frontend_url') . '/reset-password?' . http_build_query([
        'token' => $this->token,
        'email' => $notifiable->email
        ]);

    return (new MailMessage)
        ->subject('Reset Your Password - ' . config('app.name'))
        ->greeting('Hello!')
        ->line('You are receiving this email because we received a password reset request for your account.')
        ->action('Reset Password', $url)
        ->line('This password reset link will expire in ' . config('auth.passwords.users.expire', 60) . ' minutes.')
        ->line('If you did not request a password reset, no further action is required.')
        ->salutation('Regards, ' . config('app.name'));
    }
}
