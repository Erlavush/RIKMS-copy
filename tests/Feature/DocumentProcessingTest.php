<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\User;
use App\Services\DocumentProcessingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Exception;

class DocumentProcessingTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    public function test_document_processing_pipeline_success(): void
    {
        Storage::fake('local');
        $user = User::where('email', 'test@example.com')->firstOrFail();
        $file = UploadedFile::fake()->create('test-document.pdf', 50, 'application/pdf');

        $document = Document::create([
            'agency_id' => $user->agency_id,
            'uploaded_by' => $user->id,
            'document_type' => Document::RESEARCH_STUDY,
            'title' => 'Sample Research Title',
            'file_path' => $file->store('research-documents', 'local'),
            'original_filename' => 'test-document.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => $file->getSize(),
        ]);

        $processor = resolve(DocumentProcessingService::class);
        $processor->process($document);

        $document->refresh();

        // Stage 1 Verification
        $this->assertEquals('completed', $document->processing_status);
        $this->assertEquals('passed', $document->integrity_status);
        $this->assertEquals('passed', $document->malware_status);
        $this->assertNotNull($document->hash);
        $this->assertEquals(hash_file('sha256', Storage::disk('local')->path($document->file_path)), $document->hash);

        // Stage 2 Verification (Extracted Text & Cleaned Text)
        $this->assertNotNull($document->extracted_text);
        $this->assertStringContainsString('Sample Research Title', $document->extracted_text);

        // Stage 2 Verification (Chunking)
        $this->assertGreaterThan(0, $document->chunks()->count());
        $firstChunk = $document->chunks()->first();
        $this->assertNotNull($firstChunk->content);
        $this->assertEquals(0, $firstChunk->chunk_index);
    }

    public function test_document_processing_pipeline_malware_detection(): void
    {
        Storage::fake('local');
        $user = User::where('email', 'test@example.com')->firstOrFail();

        // Create a fake file
        $file = UploadedFile::fake()->create('malware.pdf', 10);
        $path = $file->store('research-documents', 'local');

        // Write EICAR signature directly to the stored file on the fake disk
        $eicarSignature = 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE';
        Storage::disk('local')->put($path, $eicarSignature);

        $document = Document::create([
            'agency_id' => $user->agency_id,
            'uploaded_by' => $user->id,
            'document_type' => Document::RESEARCH_STUDY,
            'title' => 'Malicious File',
            'file_path' => $path,
            'original_filename' => 'malware.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => $file->getSize(),
        ]);

        $processor = resolve(DocumentProcessingService::class);

        $this->expectException(Exception::class);
        $this->expectExceptionMessage("Security Threat: Malware detected");

        try {
            $processor->process($document);
        } finally {
            $document->refresh();
            // Verify status was set to failed
            $this->assertEquals('failed', $document->processing_status);
            $this->assertEquals('failed', $document->malware_status);
            $this->assertEquals('passed', $document->integrity_status); // Integrity passed, but malware failed
        }
    }

    public function test_spa_endpoints_upload_draft_and_analyze(): void
    {
        Storage::fake('local');
        $user = User::where('email', 'test@example.com')->firstOrFail();
        $file = UploadedFile::fake()->create('sample-paper.pdf', 10, 'application/pdf');

        $response = $this->actingAs($user)->postJson('/api/rikms/documents/upload-draft', [
            'document_type' => 'research',
            'document_file' => $file,
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['document_id', 'original_filename', 'file_size']);
        $documentId = $response->json('document_id');

        $document = Document::findOrFail($documentId);
        $this->assertEquals('draft', $document->status);

        $document->update([
            'extracted_text' => "TITLE: AI Innovation in Regional Agriculture\nABSTRACT: This research discusses how Artificial Intelligence and farming technologies improve agricultural output in Region XI."
        ]);

        $analyzeResponse = $this->actingAs($user)->postJson("/api/rikms/documents/{$documentId}/analyze");

        $analyzeResponse->assertOk();
        $analyzeResponse->assertJsonFragment([
            'title' => 'AI Innovation in Regional Agriculture',
        ]);
        $this->assertStringContainsString('Artificial Intelligence and farming technologies', $analyzeResponse->json('abstract'));

        $suggestedSdgs = collect($analyzeResponse->json('suggested_sdgs'))->pluck('sdg')->toArray();
        $this->assertContains(2, $suggestedSdgs); // Agriculture / hunger matched
        $this->assertContains(9, $suggestedSdgs); // Technology / innovation matched
    }

    public function test_document_approve_reject_and_rerun_ai(): void
    {
        Storage::fake('local');
        $user = User::where('email', 'test@example.com')->firstOrFail();
        $file = UploadedFile::fake()->create('sample-paper.pdf', 10, 'application/pdf');

        $document = Document::create([
            'agency_id' => $user->agency_id,
            'uploaded_by' => $user->id,
            'document_type' => Document::RESEARCH_STUDY,
            'title' => 'Initial Title',
            'file_path' => $file->store('research-documents', 'local'),
            'original_filename' => 'sample-paper.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => $file->getSize(),
            'status' => 'pending',
        ]);

        $document->update([
            'extracted_text' => "TITLE: Real Extracted Title\nABSTRACT: This is the real parsed abstract body.\nKEYWORDS: machine learning, regional analysis"
        ]);
        $response = $this->actingAs($user)->postJson("/api/rikms/documents/{$document->id}/re-run-ai");
        $response->assertOk();
        $response->assertJsonFragment([
            'title' => 'Real Extracted Title',
        ]);

        $document->refresh();
        $this->assertEquals('Real Extracted Title', $document->metadata->title);

        $approveResponse = $this->actingAs($user)->postJson("/api/rikms/documents/{$document->id}/approve");
        $approveResponse->assertOk()->assertJson(['status' => 'success', 'document_status' => 'published']);

        $document->refresh();
        $this->assertEquals('published', $document->status);
        $this->assertNotNull($document->published_at);

        $rejectResponse = $this->actingAs($user)->postJson("/api/rikms/documents/{$document->id}/reject", ['reason' => 'Missing budget info']);
        $rejectResponse->assertOk()->assertJson(['status' => 'success', 'document_status' => 'rejected']);

        $document->refresh();
        $this->assertEquals('rejected', $document->status);
    }

    public function test_spa_visibility_filtering(): void
    {
        $agencyAdmin = User::where('email', 'test@example.com')->firstOrFail();

        $draftDoc1 = Document::create([
            'agency_id' => $agencyAdmin->agency_id,
            'uploaded_by' => $agencyAdmin->id,
            'document_type' => Document::RESEARCH_STUDY,
            'title' => 'Agency Admin Draft Research',
            'status' => 'draft',
        ]);

        $draftDoc2 = Document::create([
            'agency_id' => $agencyAdmin->agency_id + 1,
            'uploaded_by' => $agencyAdmin->id + 1,
            'document_type' => Document::RESEARCH_STUDY,
            'title' => 'Other Agency Draft Research',
            'status' => 'draft',
        ]);

        $guestResponse = $this->getJson('/api/rikms/bootstrap');
        $guestResponse->assertOk();

        $guestResearchData = collect($guestResponse->json('researchData'));
        $this->assertEmpty($guestResearchData->where('title', 'Agency Admin Draft Research'));
        $this->assertEmpty($guestResearchData->where('title', 'Other Agency Draft Research'));
        $this->assertEmpty($guestResponse->json('accessRequests'));
        $this->assertEmpty($guestResponse->json('auditLogs'));

        $adminResponse = $this->actingAs($agencyAdmin)->getJson('/api/rikms/bootstrap');
        $adminResponse->assertOk();

        $adminResearchData = collect($adminResponse->json('researchData'));
        $this->assertNotEmpty($adminResearchData->where('title', 'Agency Admin Draft Research'));
        $this->assertEmpty($adminResearchData->where('title', 'Other Agency Draft Research'));
    }
}
