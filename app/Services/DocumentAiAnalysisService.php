<?php

namespace App\Services;

use App\Jobs\AnalyzeRikmsDocument;
use App\Models\Document;
use App\Models\DocumentAiAnalysis;
use App\Models\User;
use App\Support\DocumentStorage;
use Illuminate\Support\Facades\Http;
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

        // ── Pre-flight OCR detection via the Docling server ────────────────
        // We call /detect now (before queuing) so the needs_ocr flag is
        // immediately visible in the API response and the UI can warn the
        // user before the job even starts.
        $needsOcr = false;
        if (config('rikms.ai.provider') === 'ollama') {
            $needsOcr = $this->detectNeedsOcr(
                Storage::disk(DocumentStorage::disk())->path($document->file_path)
            );
        }

        $analysis = DocumentAiAnalysis::query()->create([
            'document_id'  => $document->id,
            'requested_by' => $requester?->id,
            'status'       => 'queued',
            'needs_ocr'    => $needsOcr,
            'model'        => config('rikms.ai.provider') === 'ollama'
                ? config('rikms.ai.ollama.model', 'gemma2:2b')
                : config('rikms.ai.model', 'gemini-3.1-flash-lite'),
            'prompt_version' => (string) config('rikms.ai.prompt_version'),
            'source_hash'    => $this->sourceHash($document),
        ]);

        AnalyzeRikmsDocument::dispatch($analysis->id)->onQueue('ai');

        return $analysis;
    }

    /**
     * Fast pre-flight: ask the Docling server if the PDF is image-only.
     * Uses POST /detect which runs in milliseconds (pypdf inspection, no GPU).
     * Returns false if the Docling server is unreachable so the job still runs.
     */
    private function detectNeedsOcr(string $pdfPath): bool
    {
        $base = rtrim((string) config('rikms.ai.docling.base_url', 'http://127.0.0.1:5001'), '/');
        try {
            $response = Http::timeout(5)->post("{$base}/detect", ['file' => $pdfPath]);
            if ($response->successful()) {
                return (bool) $response->json('needs_ocr', false);
            }
        } catch (\Throwable) {
            // Docling server may not be running yet; the job itself will re-detect.
        }
        return false;
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
            'id'              => $analysis->id,
            'status'          => $analysis->status,
            'model'           => $analysis->model,
            'promptVersion'   => $analysis->prompt_version,
            'extractionMethod' => $analysis->extraction_method,
            'needsOcr'        => (bool) $analysis->needs_ocr,
            'suggestions'     => $analysis->suggestions,
            'acceptedFields'  => $analysis->accepted_fields ?? [],
            'confidence'      => $analysis->confidence,
            'inputTokens'     => $analysis->input_tokens,
            'outputTokens'    => $analysis->output_tokens,
            'reasoningTokens' => $analysis->reasoning_tokens,
            'estimatedCostUsd' => $analysis->estimated_cost_usd,
            'errorMessage'    => $analysis->error_message,
            'requestedBy'     => $analysis->requester?->name,
            'reviewedBy'      => $analysis->reviewer?->name,
            'ocrDuration'     => $analysis->ocr_duration !== null ? (int) $analysis->ocr_duration : null,
            'modelDuration'   => $analysis->model_duration !== null ? (int) $analysis->model_duration : null,
            'createdAt'       => $analysis->created_at->toISOString(),
            'startedAt'       => $analysis->started_at?->toISOString(),
            'completedAt'     => $analysis->completed_at?->toISOString(),
            'reviewedAt'      => $analysis->reviewed_at?->toISOString(),
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
