<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class OllamaDocumentAnalysisService implements DocumentAnalysisDriver
{
    public function analyze(Document $document): array
    {
        $this->assertDoclingRunning();

        $python = config('rikms.ai.ollama.python_path', 'python');
        $script = base_path('scripts/paper_metadata_extractor.py');
        $pdfPath = Storage::disk('documents')->path($document->file_path);

        // 1. Perform Docling conversion directly from PHP
        $base = rtrim((string) config('rikms.ai.docling.base_url', 'http://127.0.0.1:5001'), '/');
        $startOcr = microtime(true);

        $response = Http::timeout(300)->post("{$base}/convert", [
            'file' => $pdfPath,
            'use_cache' => true,
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('Docling conversion failed: ' . $response->body());
        }

        $ocrDuration = (int) (microtime(true) - $startOcr);
        $data = $response->json();
        $needsOcr = (bool) ($data['needs_ocr'] ?? false);
        $markdown = $data['markdown'] ?? '';

        // 2. Resolve cached markdown file path
        $fileDir = dirname($pdfPath);
        $fileStem = pathinfo($pdfPath, PATHINFO_FILENAME);
        $mdPath = dirname($fileDir) . '/markdown_docling/' . $fileStem . '_docling.md';

        if (! file_exists($mdPath) && $markdown) {
            if (! is_dir(dirname($mdPath))) {
                mkdir(dirname($mdPath), 0755, true);
            }
            file_put_contents($mdPath, $markdown);
        }

        $tempOutput = tempnam(sys_get_temp_dir(), 'rikms-ollama-');

        $analysis = \App\Models\DocumentAiAnalysis::query()
            ->where('document_id', $document->id)
            ->whereIn('status', ['queued', 'processing'])
            ->latest()
            ->first();
        $needsOcrPre = $analysis ? (bool) $analysis->needs_ocr : false;

        // Remove timeout (null) for OCR processes to allow processing scanned/heavy files
        $timeout = $needsOcrPre ? null : (int) config('rikms.ai.timeout_seconds', 300);

        // 3. Run the python script passing the markdown path
        $process = Process::timeout($timeout)->run([
            $python,
            $script,
            '--file', $mdPath,
            '--action', 'extract',
            '--output', $tempOutput,
            '--model', config('rikms.ai.ollama.model', 'gemma2:2b'),
        ]);

        if (! $process->successful()) {
            throw new RuntimeException('Ollama extraction failed: ' . $process->errorOutput());
        }

        $json = file_get_contents($tempOutput);
        @unlink($tempOutput);

        $suggestions = json_decode($json, true);
        if (! is_array($suggestions)) {
            throw new RuntimeException('Failed to parse extraction output.');
        }

        $modelDuration = $suggestions['model_duration'] ?? null;
        unset($suggestions['model_duration']); // keep suggestions clean for the schema validator

        return [
            'suggestions'       => $suggestions,
            'extraction_method' => $needsOcr ? 'local_gemma_rag_docling_ocr' : 'local_gemma_rag_docling',
            'needs_ocr'         => $needsOcr,
            'ocr_duration'      => $ocrDuration,
            'model_duration'    => $modelDuration,
            'input_tokens'      => 0,
            'output_tokens'     => 0,
            'reasoning_tokens'  => 0,
            'estimated_cost_usd' => 0.00,
        ];
    }

    /**
     * Ping the Docling server health endpoint. Throws a clear error if it is not running
     * so the queue job fails fast rather than timing out after 300 seconds.
     */
    private function assertDoclingRunning(): void
    {
        $base = rtrim((string) config('rikms.ai.docling.base_url', 'http://127.0.0.1:5001'), '/');
        try {
            $response = Http::timeout(3)->get("{$base}/health");
            if ($response->successful()) {
                return;
            }
        } catch (\Throwable $e) {
            // fall through to throw below
        }
        throw new RuntimeException(
            'Docling server is not running. Start it first: python scripts/docling_server.py'
        );
    }
}
