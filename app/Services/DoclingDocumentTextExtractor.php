<?php

namespace App\Services;

use App\Contracts\LocalDocumentTextExtractor;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class DoclingDocumentTextExtractor implements LocalDocumentTextExtractor
{
    public function __construct(
        private readonly LocalExtractorProcessRunner $processes,
    ) {}

    public function key(): string
    {
        return 'docling';
    }

    public function configured(): bool
    {
        return trim((string) config('rikms.ai.local_extractor.docling.python_command')) !== '';
    }

    /** @return array{method: string, text: string}|null */
    public function extract(string $pdfPath): ?array
    {
        if (! $this->configured()) {
            return null;
        }

        $python = $this->regularFile((string) config('rikms.ai.local_extractor.docling.python_command'), 'Docling Python executable');
        $script = $this->regularFile((string) config('rikms.ai.local_extractor.docling.script'), 'Docling wrapper');
        $source = $this->regularFile($pdfPath, 'PDF source');
        $files = new Filesystem;
        $workingDirectory = sys_get_temp_dir().DIRECTORY_SEPARATOR.'rikms-docling-'.Str::uuid();
        $outputPath = $workingDirectory.DIRECTORY_SEPARATOR.'result.json';

        try {
            $files->makeDirectory($workingDirectory, 0700, true, true);
            $command = [
                $python,
                $script,
                '--input', $source,
                '--output', $outputPath,
                '--max-pages', (string) max(1, min(100, (int) config('rikms.ai.local_extractor.max_pages'))),
                '--max-characters', (string) $this->maximumCharacters(),
            ];

            if (! $this->processes->run($command, (int) config('rikms.ai.local_extractor.timeout_seconds'))) {
                return null;
            }

            $payload = $this->readResult($outputPath, $workingDirectory);
            $text = $this->normalize((string) ($payload['text'] ?? ''));
            if (mb_strlen($text) < (int) config('rikms.ai.minimum_embedded_text_characters')) {
                return null;
            }

            return [
                'method' => 'local_docling_markdown',
                'text' => mb_substr($text, 0, $this->maximumCharacters()),
            ];
        } catch (Throwable $exception) {
            if ($exception instanceof RuntimeException) {
                throw $exception;
            }

            return null;
        } finally {
            $files->deleteDirectory($workingDirectory);
        }
    }

    /** @return array<string, mixed> */
    private function readResult(string $outputPath, string $workingDirectory): array
    {
        clearstatcache(true, $outputPath);
        if (! is_file($outputPath) || is_link($outputPath)) {
            return [];
        }

        $realOutput = realpath($outputPath);
        $realWorkingDirectory = realpath($workingDirectory);
        if ($realOutput === false || $realWorkingDirectory === false || dirname($realOutput) !== $realWorkingDirectory) {
            throw new RuntimeException('Docling wrote outside its private working directory.');
        }

        $maximumBytes = $this->maximumOutputBytes();
        $size = filesize($realOutput);
        if ($size === false || $size > $maximumBytes) {
            throw new RuntimeException('Docling output exceeded the configured limit.');
        }

        $contents = file_get_contents($realOutput);
        $decoded = is_string($contents) ? json_decode($contents, true) : null;

        return is_array($decoded) ? $decoded : [];
    }

    private function regularFile(string $path, string $label): string
    {
        $path = trim($path);
        if ($path === '' || preg_match('/[\x00-\x1F\x7F]/', $path)) {
            throw new RuntimeException($label.' path is invalid.');
        }

        $resolved = realpath($path);
        if ($resolved === false || ! is_file($resolved) || is_link($path)) {
            throw new RuntimeException($label.' must be an existing regular file.');
        }

        return $resolved;
    }

    private function maximumCharacters(): int
    {
        return max(1000, min(600000, (int) config('rikms.ai.max_text_characters')));
    }

    private function maximumOutputBytes(): int
    {
        return max(4096, min(4_000_000, (int) config('rikms.ai.local_extractor.max_output_bytes')));
    }

    private function normalize(string $text): string
    {
        $text = str_replace("\0", '', $text);
        $text = preg_replace('/[ \t]+/u', ' ', $text) ?? $text;
        $text = preg_replace('/\R{3,}/u', "\n\n", $text) ?? $text;

        return trim($text);
    }
}
