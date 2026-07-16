<?php

namespace App\Services;

use App\Contracts\DocumentAnalysisProvider;
use App\Models\Document;
use App\Support\DocumentStorage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class VertexDocumentAnalysisService implements DocumentAnalysisProvider
{
    public function __construct(
        private readonly GoogleCloudAccessTokenProvider $tokens,
        private readonly DocumentTextExtractionService $extractor,
        private readonly RikmsMetadataSchema $metadata,
    ) {}

    /** @return array{suggestions: array<string, mixed>, extraction_method: string, input_tokens: int, output_tokens: int, reasoning_tokens: int, estimated_cost_usd: float} */
    public function analyze(Document $document): array
    {
        if (! config('rikms.ai.enabled')) {
            throw new RuntimeException('RIKMS AI document assistance is disabled.');
        }

        $project = (string) config('rikms.ai.project_id');
        $location = (string) config('rikms.ai.location');
        $model = (string) config('rikms.ai.model');
        if ($project === '' || $location === '' || $model === '') {
            throw new RuntimeException('Vertex AI is not fully configured.');
        }

        $extracted = $this->extractor->extract($document);
        $parts = $extracted
            ? [['text' => $this->metadata->analysisInstruction()."\n\nDOCUMENT TEXT:\n".$extracted['text']]]
            : [$this->pdfPart($document), ['text' => $this->metadata->analysisInstruction()]];

        $endpoint = sprintf(
            'https://aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:generateContent',
            rawurlencode($project),
            rawurlencode($location),
            rawurlencode($model),
        );

        $response = Http::withToken($this->tokens->token())
            ->acceptJson()
            ->timeout((int) config('rikms.ai.timeout_seconds'))
            ->retry(2, 750, throw: false)
            ->post($endpoint, [
                'systemInstruction' => ['parts' => [[
                    'text' => $this->metadata->systemInstruction(),
                ]]],
                'contents' => [['role' => 'user', 'parts' => $parts]],
                'generationConfig' => [
                    'temperature' => 0.1,
                    'maxOutputTokens' => 8192,
                    'responseMimeType' => 'application/json',
                    'responseSchema' => $this->metadata->vertexResponseSchema(),
                ],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Vertex AI request failed with HTTP '.$response->status().'.');
        }

        $json = (string) $response->json('candidates.0.content.parts.0.text', '');
        $suggestions = json_decode($json, true);
        if (! is_array($suggestions)) {
            throw new RuntimeException('Vertex AI returned an invalid structured response.');
        }
        $suggestions = $this->metadata->validate($suggestions);

        $input = (int) $response->json('usageMetadata.promptTokenCount', 0);
        $output = (int) $response->json('usageMetadata.candidatesTokenCount', 0);
        $reasoning = (int) $response->json('usageMetadata.thoughtsTokenCount', 0);
        $estimatedCost = ($input / 1_000_000) * (float) config('rikms.ai.pricing.input_per_million')
            + (($output + $reasoning) / 1_000_000) * (float) config('rikms.ai.pricing.output_per_million');

        return [
            'suggestions' => $suggestions,
            'extraction_method' => $extracted['method'] ?? 'gemini_pdf_understanding',
            'input_tokens' => $input,
            'output_tokens' => $output,
            'reasoning_tokens' => $reasoning,
            'estimated_cost_usd' => round($estimatedCost, 6),
        ];
    }

    /** @return array<string, mixed> */
    private function pdfPart(Document $document): array
    {
        $bucket = trim((string) config('rikms.ai.documents_gcs_bucket'));
        if ($bucket !== '') {
            return ['fileData' => [
                'mimeType' => 'application/pdf',
                'fileUri' => 'gs://'.$bucket.'/'.ltrim((string) $document->file_path, '/'),
            ]];
        }

        $disk = Storage::disk(DocumentStorage::disk());
        $size = $disk->size((string) $document->file_path);
        if ($size > 7 * 1024 * 1024) {
            throw new RuntimeException('A PDF above 7 MB requires DOCUMENTS_GCS_BUCKET for Vertex AI processing.');
        }

        return ['inlineData' => [
            'mimeType' => 'application/pdf',
            'data' => base64_encode($disk->get((string) $document->file_path)),
        ]];
    }
}
