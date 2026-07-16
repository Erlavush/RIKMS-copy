<?php

namespace App\Jobs;

use App\Models\Document;
use App\Models\DocumentAiAnalysis;
use App\Services\DocumentAiAnalysisService;
use App\Services\DocumentProcessingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ProcessDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 180;

    public function __construct(public readonly int $documentId) {}

    public function middleware(): array
    {
        return [(new WithoutOverlapping('rikms-document-processing-'.$this->documentId))->expireAfter(240)];
    }

    /**
     * Execute the job.
     */
    public function handle(DocumentProcessingService $processor, DocumentAiAnalysisService $analyses): void
    {
        $document = Document::query()->findOrFail($this->documentId);
        $processor->process($document);

        if (config('rikms.ai.enabled')) {
            $analyses->dispatchStagedAfterValidation($document);
        }
    }

    public function failed(?Throwable $exception): void
    {
        DocumentAiAnalysis::query()
            ->where('document_id', $this->documentId)
            ->where('status', 'queued')
            ->update([
                'status' => 'failed',
                'error_code' => 'DocumentSafetyProcessingFailed',
                'error_message' => 'Source safety processing failed. The document was not sent for AI analysis.',
                'completed_at' => now(),
            ]);
    }
}
