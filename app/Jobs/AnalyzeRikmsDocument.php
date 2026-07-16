<?php

namespace App\Jobs;

use App\Models\DocumentAiAnalysis;
use App\Services\DocumentAiAnalysisService;
use App\Services\VertexDocumentAnalysisService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class AnalyzeRikmsDocument implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(public readonly int $analysisId) {}

    public function middleware(): array
    {
        return [(new WithoutOverlapping('rikms-ai-analysis-'.$this->analysisId))->expireAfter(180)];
    }

    public function backoff(): array
    {
        return [15, 60, 180];
    }

    public function handle(VertexDocumentAnalysisService $vertex, DocumentAiAnalysisService $gate): void
    {
        $analysis = DocumentAiAnalysis::query()->with('document')->findOrFail($this->analysisId);
        if (in_array($analysis->status, ['completed', 'reviewed'], true)) {
            return;
        }

        try {
            $gate->assertReadyForAnalysis($analysis);
            $analysis->update([
                'status' => 'processing',
                'started_at' => $analysis->started_at ?? now(),
                'error_code' => null,
                'error_message' => null,
            ]);
            $result = $vertex->analyze($analysis->document);
            $gate->assertReadyForAnalysis($analysis);
            $suggestions = $result['suggestions'];
            $analysis->update([
                'status' => 'completed',
                'suggestions' => $suggestions,
                'confidence' => $suggestions['overall_confidence'] ?? null,
                'extraction_method' => $result['extraction_method'],
                'input_tokens' => $result['input_tokens'],
                'output_tokens' => $result['output_tokens'],
                'reasoning_tokens' => $result['reasoning_tokens'],
                'estimated_cost_usd' => $result['estimated_cost_usd'],
                'completed_at' => now(),
            ]);
        } catch (Throwable $exception) {
            $analysis->update([
                'status' => 'failed',
                'error_code' => class_basename($exception),
                'error_message' => 'Analysis failed without changing the document. Retry after checking the AI service configuration.',
                'completed_at' => now(),
            ]);
            Log::warning('RIKMS AI analysis failed.', [
                'analysis_id' => $analysis->id,
                'document_id' => $analysis->document_id,
                'exception_class' => $exception::class,
            ]);

            throw $exception;
        }
    }
}
