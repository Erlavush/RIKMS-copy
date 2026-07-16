<?php

namespace Tests\Feature;

use App\Events\DocumentSourceStored;
use App\Jobs\AnalyzeRikmsDocument;
use App\Jobs\ProcessDocumentJob;
use App\Models\Agency;
use App\Models\Document;
use App\Models\User;
use App\Services\DocumentAiAnalysisService;
use App\Services\DocumentProcessingService;
use App\Services\DocumentTextExtractionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Mockery\MockInterface;
use RuntimeException;
use Tests\TestCase;

class DocumentProcessingTest extends TestCase
{
    use RefreshDatabase;

    public function test_stored_document_event_queues_processing_when_enabled(): void
    {
        Queue::fake();
        config(['rikms.document_processing.auto_queue' => true]);

        DocumentSourceStored::dispatch(123);

        Queue::assertPushedOn('default', ProcessDocumentJob::class, function (ProcessDocumentJob $job): bool {
            return $job->documentId === 123;
        });
    }

    public function test_valid_pdf_is_hashed_extracted_and_chunked_without_fabricated_text(): void
    {
        Storage::fake('documents');
        config(['rikms.documents_disk' => 'documents', 'services.clamav.enabled' => false, 'services.clamav.required' => false]);
        $text = str_repeat('Verified regional research evidence with human review. ', 80);
        $this->mock(DocumentTextExtractionService::class, function (MockInterface $mock) use ($text): void {
            $mock->shouldReceive('extract')->once()->andReturn(['method' => 'embedded_pdf_text', 'text' => $text]);
        });
        $document = $this->documentWithContents("%PDF-1.4\nverified test document\n%%EOF");

        resolve(DocumentProcessingService::class)->process($document);
        $document->refresh();

        $this->assertSame('completed', $document->processing_status);
        $this->assertSame('passed', $document->integrity_status);
        $this->assertSame('unavailable', $document->malware_status);
        $this->assertSame('embedded_pdf_text', $document->extraction_method);
        $this->assertSame(trim($text), $document->extracted_text);
        $this->assertSame(hash('sha256', "%PDF-1.4\nverified test document\n%%EOF"), $document->hash);
        $this->assertGreaterThan(1, $document->chunks()->count());
    }

    public function test_staged_ai_analysis_is_released_only_after_source_safety_processing(): void
    {
        Storage::fake('documents');
        Queue::fake();
        config([
            'rikms.documents_disk' => 'documents',
            'rikms.ai.enabled' => true,
            'services.clamav.enabled' => false,
            'services.clamav.required' => false,
        ]);
        $this->mock(DocumentTextExtractionService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('extract')->once()->andReturn([
                'method' => 'embedded_pdf_text',
                'text' => str_repeat('Verified safety-gated research text. ', 40),
            ]);
        });
        $document = $this->documentWithContents("%PDF-1.4\nverified AI source\n%%EOF");
        $analyses = resolve(DocumentAiAnalysisService::class);
        $analysis = $analyses->stage($document, User::query()->findOrFail($document->uploaded_by));

        Queue::assertNotPushed(AnalyzeRikmsDocument::class);
        (new ProcessDocumentJob($document->id))->handle(resolve(DocumentProcessingService::class), $analyses);

        $this->assertSame('queued', $analysis->fresh()->status);
        $this->assertSame('passed', $document->fresh()->integrity_status);
        Queue::assertPushedOn('ai', AnalyzeRikmsDocument::class, function (AnalyzeRikmsDocument $job) use ($analysis): bool {
            return $job->analysisId === $analysis->id;
        });
    }

    public function test_failed_source_safety_marks_staged_ai_analysis_failed_without_dispatch(): void
    {
        Storage::fake('documents');
        Queue::fake();
        config(['rikms.documents_disk' => 'documents', 'rikms.ai.enabled' => true]);
        $document = $this->documentWithContents('not a PDF');
        $analysis = resolve(DocumentAiAnalysisService::class)
            ->stage($document, User::query()->findOrFail($document->uploaded_by));
        $job = new ProcessDocumentJob($document->id);

        try {
            $job->handle(resolve(DocumentProcessingService::class), resolve(DocumentAiAnalysisService::class));
            $this->fail('Invalid source should fail safety processing.');
        } catch (RuntimeException $exception) {
            $job->failed($exception);
        }

        $analysis = $analysis->fresh();
        $this->assertSame('failed', $analysis->status);
        $this->assertSame('DocumentSafetyProcessingFailed', $analysis->error_code);
        Queue::assertNotPushed(AnalyzeRikmsDocument::class);
    }

    public function test_replaced_source_invalidates_staged_analysis_and_creates_new_hash(): void
    {
        Storage::fake('documents');
        Queue::fake();
        config(['rikms.documents_disk' => 'documents', 'rikms.ai.enabled' => true]);
        $document = $this->documentWithContents("%PDF-1.4\nfirst source\n%%EOF");
        $user = User::query()->findOrFail($document->uploaded_by);
        $analyses = resolve(DocumentAiAnalysisService::class);
        $first = $analyses->stage($document, $user);

        Storage::disk('documents')->put($document->file_path, "%PDF-1.4\nreplacement source\n%%EOF");
        $document->update([
            'integrity_status' => 'pending',
            'malware_status' => 'pending',
            'processing_status' => 'pending',
        ]);
        $second = $analyses->stage($document->fresh(), $user);

        $this->assertNotSame($first->id, $second->id);
        $this->assertNotSame($first->source_hash, $second->source_hash);
        $this->assertSame('failed', $first->fresh()->status);
        $this->assertSame('SourceReplaced', $first->fresh()->error_code);
        Queue::assertNotPushed(AnalyzeRikmsDocument::class);
    }

    public function test_missing_ocr_is_reported_honestly_and_never_generates_placeholder_research(): void
    {
        Storage::fake('documents');
        config(['rikms.documents_disk' => 'documents', 'services.clamav.enabled' => false, 'services.clamav.required' => false]);
        $this->mock(DocumentTextExtractionService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('extract')->once()->andReturnNull();
        });
        $document = $this->documentWithContents("%PDF-1.4\nscanned image placeholder\n%%EOF");

        resolve(DocumentProcessingService::class)->process($document);
        $document->refresh();

        $this->assertSame('needs_ocr', $document->processing_status);
        $this->assertNull($document->extracted_text);
        $this->assertNull($document->extraction_method);
        $this->assertSame(0, $document->chunks()->count());
        $this->assertStringContainsString('No reliable embedded text', $document->processing_error);
    }

    public function test_eicar_signature_fails_closed_before_extraction(): void
    {
        Storage::fake('documents');
        config(['rikms.documents_disk' => 'documents', 'services.clamav.enabled' => false, 'services.clamav.required' => false]);
        $this->mock(DocumentTextExtractionService::class, function (MockInterface $mock): void {
            $mock->shouldNotReceive('extract');
        });
        $document = $this->documentWithContents("%PDF-1.4\nEICAR-STANDARD-ANTIVIRUS-TEST-FILE\n%%EOF");

        try {
            resolve(DocumentProcessingService::class)->process($document);
            $this->fail('Malware signature should stop processing.');
        } catch (RuntimeException) {
            $document->refresh();
            $this->assertSame('failed', $document->processing_status);
            $this->assertSame('passed', $document->integrity_status);
            $this->assertSame('failed', $document->malware_status);
            $this->assertNull($document->extracted_text);
        }
    }

    private function documentWithContents(string $contents): Document
    {
        $agency = Agency::query()->firstOrCreate(['name' => 'Processing Test Agency'], [
            'abbreviation' => 'PTA',
            'type' => 'Government Agency',
            'is_active' => true,
        ]);
        $user = User::factory()->create([
            'role' => 'agency_admin',
            'agency_id' => $agency->id,
            'is_active' => true,
            'must_change_password' => false,
        ]);
        $path = 'research-documents/'.uniqid('processing-', true).'.pdf';
        Storage::disk('documents')->put($path, $contents);

        return Document::query()->create([
            'agency_id' => $user->agency_id,
            'uploaded_by' => $user->id,
            'document_type' => Document::RESEARCH_STUDY,
            'title' => 'Processing test document',
            'file_path' => $path,
            'original_filename' => 'processing-test.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => strlen($contents),
        ]);
    }
}
