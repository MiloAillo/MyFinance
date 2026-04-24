<?php

namespace App\Notifications\API\V1\User\Auth\Verified;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CredentialsChangesNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public $field = null)
    {
        $this->field = $field;
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
        $additional = $this->field ? ", especially your {$this->field}" : '';
        return (new MailMessage)
            ->subject('Credentials Changed - ' . config('app.name'))
            ->greeting('Hello!')
            ->line("You are receiving this email because your account credentials have been changed{$additional}.")
            // ->action('Verify New Email', $url)|
            ->line('If you really did this change, no further action is required.')
            ->salutation('Regards, ' . config('app.name'));
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
