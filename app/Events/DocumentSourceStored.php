<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DocumentSourceStored
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly int $documentId,
        public readonly bool $replacement = false,
    ) {}
}
