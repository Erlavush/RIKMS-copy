<?php

namespace App\Notifications;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DocumentSubmittedMailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Document $document)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $title = $this->document->metadata?->title ?: $this->document->title;

        return (new MailMessage)
            ->subject('RIKMS document awaiting review')
            ->greeting('Hello '.$notifiable->name.',')
            ->line("A new document, \"{$title}\", has been submitted for moderation.")
            ->action('Review document', url('/admin/moderation?document='.$this->document->id))
            ->line('This message was sent by RIKMS.');
    }
}
