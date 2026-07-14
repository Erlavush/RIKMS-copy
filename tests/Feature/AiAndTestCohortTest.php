<?php

namespace Tests\Feature;

use App\Jobs\AnalyzeRikmsDocument;
use App\Models\Document;
use App\Models\DocumentAiAnalysis;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AiAndTestCohortTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    public function test_ai_enabled_upload_stays_draft_and_queues_review_gated_analysis(): void
    {
        Storage::fake('documents');
        Queue::fake();
        config()->set('rikms.ai.enabled', true);
        config()->set('rikms.ai.auto_queue', true);
        config()->set('rikms.ai.project_id', 'rikms-test-project');

        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        $response = $this->actingAs($user)->post('/api/rikms/documents', [
            'document_type' => 'research',
            'submit_mode' => 'submit',
            'title' => 'Human review required',
            'year' => 2026,
            'access_mode' => 'request_access',
            'metadata' => json_encode(['title' => 'Human review required', 'authors' => [], 'keywords' => []]),
            'public_fields' => json_encode(['title']),
            'sdg_tags' => json_encode([9]),
            'document_file' => UploadedFile::fake()->create('source.pdf', 20, 'application/pdf'),
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', 'draft')
            ->assertJsonPath('analysisQueued', true);
        $analysis = DocumentAiAnalysis::query()->firstOrFail();
        $this->assertSame('queued', $analysis->status);
        Queue::assertPushedOn('ai', AnalyzeRikmsDocument::class);
    }

    public function test_completed_suggestions_require_explicit_human_acceptance(): void
    {
        Storage::fake('documents');
        Queue::fake();
        config()->set('rikms.ai.enabled', true);
        config()->set('rikms.ai.auto_queue', false);
        $user = User::query()->where('email', 'test@example.com')->firstOrFail();

        $document = Document::query()->create([
            'agency_id' => $user->agency_id,
            'uploaded_by' => $user->id,
            'document_type' => Document::RESEARCH_STUDY,
            'title' => 'AI review source',
            'file_path' => 'research-documents/ai-review.pdf',
            'original_filename' => 'ai-review.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 20,
            'status' => 'draft',
            'year' => 2026,
            'access_mode' => 'request_access',
        ]);
        Storage::disk('documents')->put($document->file_path, '%PDF-1.4 test');

        $this->actingAs($user)
            ->postJson("/api/rikms/agency/documents/{$document->id}/ai-analysis")
            ->assertAccepted()
            ->assertJsonPath('data.status', 'queued');

        $analysis = $document->aiAnalyses()->firstOrFail();
        $analysis->update([
            'status' => 'completed',
            'suggestions' => [
                'title' => 'Suggested title',
                'overall_confidence' => 0.9,
                'suggested_sdgs' => [],
            ],
            'completed_at' => now(),
        ]);

        $this->actingAs($user)
            ->postJson("/api/rikms/agency/documents/{$document->id}/ai-analysis/{$analysis->id}/accept", [
                'accepted_fields' => ['title'],
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'reviewed');

        $this->assertDatabaseHas('document_ai_analyses', [
            'id' => $analysis->id,
            'status' => 'reviewed',
            'reviewed_by' => $user->id,
        ]);
        $this->assertSame('AI review source', $document->fresh()->title, 'Acceptance records review but never silently mutates metadata.');
    }

    public function test_demo_purge_does_not_match_user_created_papers(): void
    {
        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        $real = Document::query()->create([
            'agency_id' => $user->agency_id,
            'uploaded_by' => $user->id,
            'document_type' => Document::RESEARCH_STUDY,
            'title' => 'Tester uploaded evidence paper',
            'status' => 'draft',
            'year' => 2026,
            'access_mode' => 'request_access',
        ]);

        $this->artisan('rikms:purge-demo-data --execute')->assertSuccessful();

        $this->assertDatabaseHas('documents', ['id' => $real->id]);
        $this->assertDatabaseMissing('documents', [
            'title' => 'Cybersecurity data science: an overview from machine learning perspective',
        ]);
        $this->assertSame(1, Document::query()->count());
    }

    public function test_private_manifest_provisions_exactly_seven_forced_rotation_accounts(): void
    {
        $manifest = tempnam(sys_get_temp_dir(), 'rikms-cohort-');
        $payload = [
            'admin' => ['name' => 'Team Leader', 'email' => 'leader@gmail.com'],
            'testers' => collect(range(1, 6))->map(fn (int $index) => [
                'name' => "Tester {$index}",
                'email' => "tester{$index}@gmail.com",
                'company' => "Authorized Test Company {$index}",
                'company_abbreviation' => "ATC{$index}",
            ])->all(),
        ];
        file_put_contents($manifest, json_encode($payload, JSON_THROW_ON_ERROR));
        putenv('RIKMS_TEST_PASSWORD_ADMIN=Strong!AdminPassword2026');
        foreach (range(1, 6) as $index) {
            putenv("RIKMS_TEST_PASSWORD_{$index}=Strong!TesterPassword{$index}#2026");
        }

        try {
            $this->artisan("rikms:provision-test-cohort {$manifest} --disable-demo")->assertSuccessful();
        } finally {
            @unlink($manifest);
            putenv('RIKMS_TEST_PASSWORD_ADMIN');
            foreach (range(1, 6) as $index) {
                putenv("RIKMS_TEST_PASSWORD_{$index}");
            }
        }

        $this->assertSame(6, User::query()->where('email', 'like', 'tester%@gmail.com')->count());
        $this->assertDatabaseHas('users', [
            'email' => 'leader@gmail.com',
            'role' => 'super_admin',
            'must_change_password' => true,
        ]);
        $this->assertSame(6, User::query()->where('role', 'agency_admin')->where('must_change_password', true)
            ->where('email', 'like', 'tester%@gmail.com')->whereNotNull('agency_id')->count());
        $this->assertFalse(User::query()->where('email', 'test@example.com')->firstOrFail()->is_active);
    }
}
