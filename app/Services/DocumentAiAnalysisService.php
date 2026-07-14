<?php

namespace App\Services;

use App\Jobs\AnalyzeRikmsDocument;
use App\Models\Document;
use App\Models\DocumentAiAnalysis;
use App\Models\User;
use App\Support\DocumentStorage;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class DocumentAiAnalysisService
{
    public function queue(Document $document, ?User $requester = null): DocumentAiAnalysis
    {
        if (! config('rikms.ai.enabled')) {
            throw ValidationException::withMessages(['ai' => 'AI document assistance is currently disabled.']);
        }
        if (! $document->file_path || ! Storage::disk(DocumentStorage::disk())->exists($document->file_path)) {
            throw ValidationException::withMessages(['document_file' => 'Upload a source PDF before requesting analysis.']);
        }

        $active = DocumentAiAnalysis::query()
            ->where('document_id', $document->id)
            ->whereIn('status', ['queued', 'processing'])
            ->latest()
            ->first();
        if ($active) {
            return $active;
        }

        $analysis = DocumentAiAnalysis::query()->create([
            'document_id' => $document->id,
            'requested_by' => $requester?->id,
            'status' => 'queued',
            'model' => (string) config('rikms.ai.model'),
            'prompt_version' => (string) config('rikms.ai.prompt_version'),
            'source_hash' => $this->sourceHash($document),
        ]);

        AnalyzeRikmsDocument::dispatch($analysis->id)->onQueue('ai');

        return $analysis;
    }

    /** @return array<string, mixed>|null */
    public function presentLatest(Document $document): ?array
    {
        $analysis = DocumentAiAnalysis::query()
            ->where('document_id', $document->id)
            ->with(['requester', 'reviewer'])
            ->latest()
            ->first();

        return $analysis ? $this->present($analysis) : null;
    }

    /** @return array<string, mixed> */
    public function present(DocumentAiAnalysis $analysis): array
    {
        return [
            'id' => $analysis->id,
            'status' => $analysis->status,
            'model' => $analysis->model,
            'promptVersion' => $analysis->prompt_version,
            'extractionMethod' => $analysis->extraction_method,
            'suggestions' => $analysis->suggestions,
            'acceptedFields' => $analysis->accepted_fields ?? [],
            'confidence' => $analysis->confidence,
            'inputTokens' => $analysis->input_tokens,
            'outputTokens' => $analysis->output_tokens,
            'reasoningTokens' => $analysis->reasoning_tokens,
            'estimatedCostUsd' => $analysis->estimated_cost_usd,
            'errorMessage' => $analysis->error_message,
            'requestedBy' => $analysis->requester?->name,
            'reviewedBy' => $analysis->reviewer?->name,
            'createdAt' => $analysis->created_at->toISOString(),
            'startedAt' => $analysis->started_at?->toISOString(),
            'completedAt' => $analysis->completed_at?->toISOString(),
            'reviewedAt' => $analysis->reviewed_at?->toISOString(),
        ];
    }

    private function sourceHash(Document $document): string
    {
        $stream = Storage::disk(DocumentStorage::disk())->readStream((string) $document->file_path);
        if (! is_resource($stream)) {
            throw new RuntimeException('The source document could not be opened for hashing.');
        }

        try {
            $context = hash_init('sha256');
            hash_update_stream($context, $stream);

            return hash_final($context);
        } finally {
            fclose($stream);
        }
    }
}
