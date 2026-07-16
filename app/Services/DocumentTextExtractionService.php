<?php

namespace App\Services;

use App\Models\Document;
use App\Support\DocumentStorage;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Smalot\PdfParser\Parser;
use Symfony\Component\Process\Process;
use Throwable;

class DocumentTextExtractionService
{
    public function __construct(
        private readonly GoogleCloudAccessTokenProvider $tokens,
    ) {}

    /** @return array{method: string, text: string}|null */
    public function extract(Document $document): ?array
    {
        $local = $this->localPdfText($document);
        if ($local !== null) {
            return ['method' => 'local_pdftotext', 'text' => $local];
        }

        $ocr = $this->localOcrText($document);
        if ($ocr !== null) {
            return ['method' => 'local_tesseract_ocr', 'text' => $ocr];
        }

        $embedded = $this->embeddedText($document);
        if ($embedded !== null) {
            return ['method' => 'embedded_pdf_text', 'text' => $embedded];
        }

        if (config('rikms.ai.document_ai.processor_id')) {
            return ['method' => 'document_ai_ocr', 'text' => $this->documentAiText($document)];
        }

        return null;
    }

    private function localPdfText(Document $document): ?string
    {
        $command = trim((string) config('rikms.ai.local_pdf_text_command'));
        if (! app()->environment(['local', 'testing']) || $command === '') {
            return null;
        }

        try {
            $path = Storage::disk(DocumentStorage::disk())->path((string) $document->file_path);
            $process = new Process([$command, '-layout', '-enc', 'UTF-8', $path, '-']);
            $process->setTimeout((int) config('rikms.ai.timeout_seconds'));
            $process->run();
            if (! $process->isSuccessful()) {
                return null;
            }

            $pageTexts = collect(preg_split('/\f/u', $process->getOutput()) ?: [])
                ->map(fn (string $text): string => $this->normalize($text))
                ->filter()
                ->values();
            if (mb_strlen($this->normalize($pageTexts->implode("\n\n"))) < (int) config('rikms.ai.minimum_embedded_text_characters')) {
                return null;
            }

            return $this->withPageMarkers($pageTexts->all());
        } catch (Throwable) {
            return null;
        }
    }

    private function localOcrText(Document $document): ?string
    {
        $renderer = trim((string) config('rikms.ai.local_pdf_render_command'));
        $ocr = trim((string) config('rikms.ai.local_ocr_command'));
        if (! app()->environment(['local', 'testing']) || $renderer === '' || $ocr === '') {
            return null;
        }

        $files = new Filesystem;
        $workingDirectory = sys_get_temp_dir().'/rikms-ocr-'.Str::uuid();

        try {
            $files->makeDirectory($workingDirectory, 0700, true, true);
            $path = Storage::disk(DocumentStorage::disk())->path((string) $document->file_path);
            $prefix = $workingDirectory.'/page';
            $render = new Process([
                $renderer,
                '-f', '1',
                '-l', (string) max(1, min(100, (int) config('rikms.ai.local_ocr_max_pages'))),
                '-r', (string) max(72, min(300, (int) config('rikms.ai.local_ocr_dpi'))),
                '-png',
                $path,
                $prefix,
            ]);
            $render->setTimeout((int) config('rikms.ai.timeout_seconds'));
            $render->run();
            if (! $render->isSuccessful()) {
                return null;
            }

            $images = glob($prefix.'-*.png') ?: [];
            natsort($images);
            $pageTexts = collect(array_values($images))->map(function (string $image) use ($ocr): string {
                $process = new Process([
                    $ocr,
                    $image,
                    'stdout',
                    '-l', (string) config('rikms.ai.local_ocr_language'),
                    '--psm', '3',
                ]);
                $process->setTimeout(max(1, min(120, (int) config('rikms.ai.local_ocr_page_timeout_seconds'))));
                $process->run();

                return $process->isSuccessful() ? $this->normalize($process->getOutput()) : '';
            })->filter()->values();

            if (mb_strlen($this->normalize($pageTexts->implode("\n\n"))) < (int) config('rikms.ai.minimum_embedded_text_characters')) {
                return null;
            }

            return $this->withPageMarkers($pageTexts->all());
        } catch (Throwable) {
            return null;
        } finally {
            $files->deleteDirectory($workingDirectory);
        }
    }

    private function embeddedText(Document $document): ?string
    {
        try {
            $path = Storage::disk(DocumentStorage::disk())->path((string) $document->file_path);
            $pdf = (new Parser)->parseFile($path);
            $pageTexts = collect($pdf->getPages())
                ->map(fn ($page): string => $this->normalize((string) $page->getText()))
                ->values();
            if ($pageTexts->isEmpty()) {
                $pageTexts = collect([$this->normalize($pdf->getText())]);
            }

            if (mb_strlen($this->normalize($pageTexts->implode("\n\n"))) < (int) config('rikms.ai.minimum_embedded_text_characters')) {
                return null;
            }

            return $this->withPageMarkers($pageTexts->all());
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

    /** @param list<string> $pageTexts */
    private function withPageMarkers(array $pageTexts): string
    {
        $markedText = collect($pageTexts)
            ->map(fn (string $text, int $index): string => '--- PAGE '.($index + 1)." ---\n".$text)
            ->implode("\n\n");

        return mb_substr($markedText, 0, (int) config('rikms.ai.max_text_characters'));
    }
}
