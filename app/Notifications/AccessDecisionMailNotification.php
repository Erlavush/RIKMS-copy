<?php

namespace App\Notifications;

use App\Models\AccessRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccessDecisionMailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly AccessRequest $accessRequest,
        public readonly string $decision,
        public readonly ?string $downloadUrl = null,
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
        $title = $this->accessRequest->document->metadata?->title ?: $this->accessRequest->document->title;
        $approved = $this->decision === 'approved';
        $mail = (new MailMessage)
            ->subject($approved ? 'Your RIKMS access request was approved' : 'RIKMS access request update')
            ->greeting('Hello '.$this->accessRequest->requester_name.',')
            ->line($approved
                ? "Your request to access \"{$title}\" has been approved."
                : "Your request to access \"{$title}\" was not approved.");

        if ($this->reason) {
            $mail->line('Decision note: '.$this->reason);
        }
        if ($approved && $this->downloadUrl) {
            $mail->action('Download document', $this->downloadUrl)
                ->line('This private link expires and has a limited number of downloads. Do not share it.');
        }

        return $mail->line('This message was sent by RIKMS.');
    }
}
