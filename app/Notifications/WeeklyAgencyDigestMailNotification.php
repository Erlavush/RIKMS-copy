<?php

namespace App\Notifications;

use App\Models\Agency;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WeeklyAgencyDigestMailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /** @param array{documents:int,downloads:int,accessRequests:int} $statistics */
    public function __construct(public readonly Agency $agency, public readonly array $statistics) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your weekly RIKMS agency digest')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Here is the past week for '.$this->agency->name.':')
            ->line($this->statistics['documents'].' document submissions')
            ->line($this->statistics['downloads'].' document downloads')
            ->line($this->statistics['accessRequests'].' new access requests')
            ->action('Open agency dashboard', url('/agency/dashboard'));
    }
}
