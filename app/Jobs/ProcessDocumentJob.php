<?php

namespace App\Jobs;

use App\Models\Document;
use App\Services\DocumentProcessingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessDocumentJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(public readonly Document $document)
    {
    }

    /**
     * Execute the job.
     */
    public function handle(DocumentProcessingService $processor): void
    {
        $processor->process($this->document);
    }
}
