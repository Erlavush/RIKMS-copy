<?php

namespace App\Services;

use App\Models\Document;
use App\Support\DocumentStorage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\Local\LocalFilesystemAdapter;
use RuntimeException;
use Throwable;

class DocumentProcessingService
{
    private const CHUNK_SIZE = 2000;

    private const CHUNK_OVERLAP = 200;

    public function __construct(
        private readonly DocumentTextExtractionService $extractor,
    ) {}

    public function process(Document $document): void
    {
        $document->update([
            'processing_status' => 'processing',
            'processing_error' => null,
            'extraction_method' => null,
        ]);

        $temporaryPath = null;
        try {
            if (! $document->file_path) {
                throw new RuntimeException('Document source file is missing.');
            }
            $disk = Storage::disk(DocumentStorage::disk());
            if (! $disk->exists($document->file_path)) {
                throw new RuntimeException('Document source file is unavailable.');
            }

            [$localPath, $temporaryPath] = $this->localPath($document->file_path);
            $this->verifyIntegrity($document, $localPath);
            $this->scanMalware($document, $localPath);

            $extraction = $this->extractor->extract($document);
            if ($extraction === null) {
                $document->chunks()->delete();
                $document->update([
                    'extracted_text' => null,
                    'extraction_method' => null,
                    'processing_status' => 'needs_ocr',
                    'processing_error' => 'No reliable embedded text was found. Configure Document AI OCR or review the source manually.',
                ]);

                return;
            }

            $text = $this->normalize($extraction['text']);
            if ($text === '') {
                throw new RuntimeException('Text extraction returned no usable content.');
            }
            $this->replaceChunks($document, $text);
            $document->update([
                'extracted_text' => $text,
                'extraction_method' => $extraction['method'],
                'processing_status' => 'completed',
                'processing_error' => null,
            ]);
        } catch (Throwable $exception) {
            $document->update([
                'processing_status' => 'failed',
                'processing_error' => 'Document processing failed. Inspect the private application logs for the failure class.',
            ]);
            Log::warning('RIKMS document processing failed.', [
                'document_id' => $document->id,
                'exception_class' => $exception::class,
            ]);

            throw $exception;
        } finally {
            if ($temporaryPath && is_file($temporaryPath)) {
                @unlink($temporaryPath);
            }
        }
    }

    private function verifyIntegrity(Document $document, string $localPath): void
    {
        if (! is_readable($localPath)) {
            $document->update(['integrity_status' => 'failed']);
            throw new RuntimeException('Document source is not readable.');
        }

        $handle = fopen($localPath, 'rb');
        $signature = $handle ? fread($handle, 5) : false;
        if (is_resource($handle)) {
            fclose($handle);
        }
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($localPath);
        if ($signature !== '%PDF-' || $mime !== 'application/pdf') {
            $document->update(['integrity_status' => 'failed']);
            throw new RuntimeException('Document content is not a valid PDF source.');
        }

        $hash = hash_file('sha256', $localPath);
        if (! is_string($hash) || strlen($hash) !== 64) {
            $document->update(['integrity_status' => 'failed']);
            throw new RuntimeException('Document SHA-256 integrity hash could not be computed.');
        }
        $size = filesize($localPath);
        if ($document->file_size && is_int($size) && $size !== $document->file_size) {
            $document->update(['integrity_status' => 'failed']);
            throw new RuntimeException('Stored document size does not match its database record.');
        }

        $document->update(['hash' => $hash, 'integrity_status' => 'passed']);
    }

    private function scanMalware(Document $document, string $localPath): void
    {
        $contents = file_get_contents($localPath, false, null, 0, 1024 * 1024);
        if (is_string($contents) && str_contains($contents, 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE')) {
            $document->update(['malware_status' => 'failed']);
            throw new RuntimeException('Malware test signature was detected.');
        }

        if (! config('services.clamav.enabled')) {
            $document->update(['malware_status' => 'unavailable']);
            if (config('services.clamav.required')) {
                throw new RuntimeException('Required malware scanner is unavailable.');
            }

            return;
        }

        $host = (string) config('services.clamav.host');
        $port = (int) config('services.clamav.port');
        $timeout = (int) config('services.clamav.timeout');
        $socket = @fsockopen($host, $port, $errorNumber, $errorMessage, $timeout);
        if (! is_resource($socket)) {
            $document->update(['malware_status' => 'unavailable']);
            throw new RuntimeException('Required malware scanner could not be reached.');
        }

        try {
            stream_set_timeout($socket, $timeout);
            $this->writeAll($socket, "zINSTREAM\0");
            $source = fopen($localPath, 'rb');
            if (! is_resource($source)) {
                throw new RuntimeException('Document could not be opened for malware scanning.');
            }
            try {
                while (! feof($source)) {
                    $chunk = fread($source, 8192);
                    if ($chunk === false) {
                        throw new RuntimeException('Document malware scan stream failed.');
                    }
                    if ($chunk !== '') {
                        $this->writeAll($socket, pack('N', strlen($chunk)).$chunk);
                    }
                }
            } finally {
                fclose($source);
            }
            $this->writeAll($socket, pack('N', 0));
            $response = fgets($socket, 4096);
            if (! is_string($response) || ! str_ends_with(trim($response), 'OK')) {
                $document->update(['malware_status' => str_contains((string) $response, 'FOUND') ? 'failed' : 'unavailable']);
                throw new RuntimeException('Document did not pass the required malware scan.');
            }
            $document->update(['malware_status' => 'passed']);
        } finally {
            fclose($socket);
        }
    }

    private function replaceChunks(Document $document, string $text): void
    {
        $document->chunks()->delete();
        $length = mb_strlen($text);
        $step = self::CHUNK_SIZE - self::CHUNK_OVERLAP;
        $index = 0;
        for ($offset = 0; $offset < $length; $offset += $step) {
            $content = trim(mb_substr($text, $offset, self::CHUNK_SIZE));
            if ($content === '') {
                continue;
            }
            $document->chunks()->create([
                'chunk_index' => $index++,
                'content' => $content,
                'word_count' => str_word_count($content),
            ]);
        }
    }

    /** @return array{0: string, 1: string|null} */
    private function localPath(string $filePath): array
    {
        $disk = Storage::disk(DocumentStorage::disk());
        try {
            if ($disk->getAdapter() instanceof LocalFilesystemAdapter) {
                return [$disk->path($filePath), null];
            }
        } catch (Throwable) {
            // Remote adapters are copied to a permission-restricted temporary file.
        }

        $source = $disk->readStream($filePath);
        if (! is_resource($source)) {
            throw new RuntimeException('Document source could not be streamed from private storage.');
        }
        $temporary = tempnam(sys_get_temp_dir(), 'rikms-document-');
        if ($temporary === false) {
            fclose($source);
            throw new RuntimeException('A temporary processing file could not be created.');
        }
        chmod($temporary, 0600);
        $destination = fopen($temporary, 'wb');
        if (! is_resource($destination)) {
            fclose($source);
            @unlink($temporary);
            throw new RuntimeException('A temporary processing file could not be opened.');
        }
        try {
            if (stream_copy_to_stream($source, $destination) === false) {
                throw new RuntimeException('Document source could not be copied for processing.');
            }
        } finally {
            fclose($source);
            fclose($destination);
        }

        return [$temporary, $temporary];
    }

    /** @param resource $stream */
    private function writeAll($stream, string $payload): void
    {
        $offset = 0;
        while ($offset < strlen($payload)) {
            $written = fwrite($stream, substr($payload, $offset));
            if ($written === false || $written === 0) {
                throw new RuntimeException('Malware scanner connection was interrupted.');
            }
            $offset += $written;
        }
    }

    private function normalize(string $text): string
    {
        $text = str_replace("\0", '', $text);
        $text = preg_replace('/[ \t]+/u', ' ', $text) ?? $text;
        $text = preg_replace('/\R{3,}/u', "\n\n", $text) ?? $text;

        return trim($text);
    }
}
