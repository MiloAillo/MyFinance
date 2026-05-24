<?php

namespace App\Notifications\API\V1\User\Auth\Verified;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class VerifiedEmailChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public string $key, public int $expiresInMinutes)
    {
        $this->key = $key;
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
        $data = $this->key;
        $expires = now()->addMinutes($this->expiresInMinutes);
        $backendUrl = URL::temporarySignedRoute('api.v1.users.update.verify.new-email', $expires, ['key' => $data]);
        $queryParams = Str::after($backendUrl, '?');

        $frontendUrl = config('app.frontend_url') . "/verify-new-email/{$data}?{$queryParams}";
        
        return (new MailMessage)
            ->subject('Verify Your New Email Address - ' . config('app.name'))
            ->view('emails.auth.new-email-verification', [
                'actionUrl' => $frontendUrl,
                'expiration' => $this->expiresInMinutes,
            ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
