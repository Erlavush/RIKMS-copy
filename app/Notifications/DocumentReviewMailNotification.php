<?php

namespace App\Notifications;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DocumentReviewMailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Document $document,
        public readonly string $decision,
        public readonly ?string $reason = null,
    ) {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $title = $this->document->metadata?->title ?: $this->document->title;
        $approved = $this->decision === 'approved';
        $mail = (new MailMessage)
            ->subject($approved ? 'RIKMS document approved' : 'RIKMS document needs revision')
            ->greeting('Hello '.$notifiable->name.',')
            ->line($approved
                ? "Your document \"{$title}\" has been approved and published."
                : "Your document \"{$title}\" was returned for revision.");

        if ($this->reason) {
            $mail->line('Reviewer feedback: '.$this->reason);
        }

        return $mail->action('View document', url('/agency/research/'.$this->document->id.'/edit'))
            ->line('This message was sent by RIKMS.');
    }
}
