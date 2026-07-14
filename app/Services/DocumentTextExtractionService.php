<?php

namespace App\Services;

use App\Models\Document;
use App\Support\DocumentStorage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Smalot\PdfParser\Parser;
use Throwable;

class DocumentTextExtractionService
{
    public function __construct(
        private readonly GoogleCloudAccessTokenProvider $tokens,
    ) {}

    /** @return array{method: string, text: string}|null */
    public function extract(Document $document): ?array
    {
        $embedded = $this->embeddedText($document);
        if ($embedded !== null) {
            return ['method' => 'embedded_pdf_text', 'text' => $embedded];
        }

        if (config('rikms.ai.document_ai.processor_id')) {
            return ['method' => 'document_ai_ocr', 'text' => $this->documentAiText($document)];
        }

        return null;
    }

    private function embeddedText(Document $document): ?string
    {
        try {
            $path = Storage::disk(DocumentStorage::disk())->path((string) $document->file_path);
            $text = (new Parser)->parseFile($path)->getText();
            $text = $this->normalize($text);

            if (mb_strlen($text) < (int) config('rikms.ai.minimum_embedded_text_characters')) {
                return null;
            }

            return mb_substr($text, 0, (int) config('rikms.ai.max_text_characters'));
        } catch (Throwable) {
            return null;
        }
    }

    private function documentAiText(Document $document): string
    {
        $project = (string) config('rikms.ai.project_id');
        $location = (string) config('rikms.ai.document_ai.location');
        $processor = (string) config('rikms.ai.document_ai.processor_id');
        if ($project === '' || $location === '' || $processor === '') {
            throw new RuntimeException('Document AI OCR is not fully configured.');
        }

        $bytes = Storage::disk(DocumentStorage::disk())->get((string) $document->file_path);
        $endpoint = sprintf(
            'https://%s-documentai.googleapis.com/v1/projects/%s/locations/%s/processors/%s:process',
            $location,
            rawurlencode($project),
            rawurlencode($location),
            rawurlencode($processor),
        );

        $response = Http::withToken($this->tokens->token())
            ->acceptJson()
            ->timeout((int) config('rikms.ai.timeout_seconds'))
            ->retry(2, 500, throw: false)
            ->post($endpoint, [
                'rawDocument' => [
                    'content' => base64_encode($bytes),
                    'mimeType' => 'application/pdf',
                ],
                'processOptions' => ['imagelessMode' => true],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Document AI OCR request failed with HTTP '.$response->status().'.');
        }

        $text = $this->normalize((string) $response->json('document.text', ''));
        if ($text === '') {
            throw new RuntimeException('Document AI OCR returned no text.');
        }

        return mb_substr($text, 0, (int) config('rikms.ai.max_text_characters'));
    }

    private function normalize(string $text): string
    {
        $text = str_replace("\0", '', $text);
        $text = preg_replace('/[ \t]+/u', ' ', $text) ?? $text;
        $text = preg_replace('/\R{3,}/u', "\n\n", $text) ?? $text;

        return trim($text);
    }
}
