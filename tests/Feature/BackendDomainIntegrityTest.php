<?php

namespace Tests\Feature;

use App\Models\AccessRequest;
use App\Models\Agency;
use App\Models\Document;
use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BackendDomainIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    public function test_seeded_pending_queue_is_reviewable_and_seeded_requests_are_eligible(): void
    {
        Notification::fake();
        $super = User::query()->where('role', 'super_admin')->firstOrFail();

        foreach (Document::query()->where('status', 'pending')->pluck('id') as $id) {
            $this->actingAs($super)->postJson('/api/rikms/admin/documents/'.$id.'/approve')->assertOk();
        }

        $this->assertDatabaseMissing('documents', ['status' => 'pending']);
        $this->assertTrue(AccessRequest::query()->get()->every(
            fn ($request) => $request->document->status === 'published'
                && in_array($request->document->access_mode, ['request_access', 'embargo_until_date'], true)
                && $request->document->file_path
        ));
    }

    public function test_public_browse_switch_blocks_all_public_document_surfaces_and_zeros_counts(): void
    {
        Storage::fake('local');
        $document = Document::query()->where('status', 'published')->firstOrFail();
        Storage::disk('local')->put('research-documents/public.pdf', 'pdf');
        $document->update([
            'access_mode' => 'public_download', 'file_path' => 'research-documents/public.pdf',
            'original_filename' => 'public.pdf',
        ]);
        PlatformSetting::create(['key' => 'allow_public_browse', 'value' => ['value' => false]]);

        $this->getJson('/api/rikms/public/documents')->assertForbidden();
        $this->getJson('/api/rikms/public/documents/'.$document->id)->assertNotFound();
        $this->get('/api/rikms/public/documents/'.$document->id.'/download')->assertForbidden();
        $bootstrap = $this->getJson('/api/rikms/bootstrap')->assertOk();
        $bootstrap->assertJsonPath('statistics.totalResearch', 0)->assertJsonPath('statistics.sdgsCovered', 0);
        $this->assertTrue(collect($bootstrap->json('agencies'))->every(fn (array $agency) => $agency['publications'] === 0));
        $this->assertTrue(collect($bootstrap->json('sdgResearchCounts'))->every(fn ($count) => $count === 0));
    }

    public function test_submission_recomputes_completion_and_ignores_blank_report_sections(): void
    {
        Notification::fake();
        Storage::fake('local');
        $user = User::query()->where('email', 'test@example.com')->firstOrFail();

        $response = $this->actingAs($user)->post('/api/rikms/documents', [
            'document_type' => 'research', 'submit_mode' => 'submit', 'year' => now()->year,
            'access_mode' => 'request_access',
            'metadata' => json_encode(['title' => 'Complete research', 'authors' => ['Researcher'], 'keywords' => ['RIKMS']]),
            'public_fields' => json_encode(['title']), 'sdg_tags' => json_encode([9]),
            'financials' => json_encode(['allocated' => 0, 'used' => 0]),
            'highlight' => json_encode(['title' => '', 'description' => '', 'featured' => false]),
            'document_file' => UploadedFile::fake()->create('complete.pdf', 10, 'application/pdf'),
        ])->assertCreated();

        $document = Document::query()->findOrFail($response->json('documentId'));
        $this->assertSame(100, $document->completion_score);
        $this->assertFalse($document->financial()->exists());
        $this->assertFalse($document->highlights()->exists());
    }

    public function test_report_submission_requires_every_report_domain_section(): void
    {
        Notification::fake();
        Storage::fake('local');
        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        $response = $this->actingAs($user)->post('/api/rikms/documents', [
            'document_type' => 'terminal', 'submit_mode' => 'draft', 'year' => now()->year,
            'metadata' => json_encode(['title' => 'Incomplete terminal report', 'authors' => [], 'keywords' => []]),
            'public_fields' => json_encode(['title']), 'sdg_tags' => json_encode([9]),
            'document_file' => UploadedFile::fake()->create('report.pdf', 10, 'application/pdf'),
        ])->assertCreated();
        $id = $response->json('documentId');

        $this->actingAs($user)->postJson('/api/rikms/agency/documents/'.$id.'/submit')
            ->assertUnprocessable()->assertJsonValidationErrors(['quarter', 'projects', 'pap.categories', 'financials.allocated']);
        $this->assertDatabaseHas('documents', ['id' => $id, 'status' => 'draft']);
    }

    public function test_partial_nested_patch_preserves_omitted_metadata_and_financial_values(): void
    {
        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        $document = Document::query()->where('status', 'draft')->where('agency_id', $user->agency_id)->firstOrFail();
        $document->metadata()->update(['authors' => ['Original Author'], 'keywords' => ['Original Keyword']]);
        $document->financial()->create([
            'allotted_budget' => 1000, 'released_amount' => 800, 'obligated_amount' => 600,
            'utilized_amount' => 100, 'remaining_balance' => 900, 'budget_utilization_percentage' => 10,
        ]);

        $this->actingAs($user)->patchJson('/api/rikms/agency/documents/'.$document->id, [
            'metadata' => ['abstract' => 'Updated abstract only.'],
            'financials' => ['used' => 200],
            'category' => 'Updated category',
        ])->assertOk()->assertJsonPath('data.category', 'Updated category');

        $document->refresh();
        $this->assertSame(['Original Author'], $document->metadata->authors);
        $this->assertSame(['Original Keyword'], $document->metadata->keywords);
        $this->assertSame(1000.0, (float) $document->financial->allotted_budget);
        $this->assertSame(800.0, (float) $document->financial->released_amount);
        $this->assertSame(600.0, (float) $document->financial->obligated_amount);
        $this->assertSame(200.0, (float) $document->financial->utilized_amount);

        $this->actingAs($user)->patchJson('/api/rikms/agency/documents/'.$document->id, [
            'financials' => ['used' => 2000],
        ])->assertUnprocessable()->assertJsonValidationErrors('financials.used');
    }

    public function test_user_moved_to_another_agency_cannot_retain_uploader_access(): void
    {
        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        $document = Document::query()->where('agency_id', $user->agency_id)->firstOrFail();
        $otherAgency = Agency::query()->whereKeyNot($user->agency_id)->firstOrFail();
        $user->update(['agency_id' => $otherAgency->id]);

        $this->actingAs($user)->getJson('/api/rikms/agency/documents/'.$document->id)->assertForbidden();
    }

    public function test_expired_embargo_rejects_access_requests(): void
    {
        Storage::fake('local');
        $document = Document::query()->where('status', 'published')->firstOrFail();
        Storage::disk('local')->put('research-documents/embargo.pdf', 'pdf');
        $document->update([
            'access_mode' => 'embargo_until_date', 'embargo_until' => now()->subDay(),
            'file_path' => 'research-documents/embargo.pdf', 'original_filename' => 'embargo.pdf',
        ]);

        $this->postJson('/api/rikms/public/documents/'.$document->id.'/access-requests', [
            'requester_name' => 'Researcher', 'requester_email' => 'researcher@example.org',
            'message' => 'Requesting this document for legitimate research.',
        ])->assertUnprocessable();
    }

    public function test_inactive_agency_keeps_public_provenance_but_cannot_bypass_download_policy(): void
    {
        Storage::fake('local');
        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        $agency = $user->agency;
        $published = Document::query()->where('agency_id', $agency->id)->where('status', 'published')->firstOrFail();
        $draft = Document::query()->where('agency_id', $agency->id)->where('status', 'draft')->firstOrFail();
        Storage::disk('local')->put('research-documents/private.pdf', 'private');
        $draft->update(['file_path' => 'research-documents/private.pdf', 'original_filename' => 'private.pdf']);
        $agency->update(['is_active' => false]);

        $agencies = collect($this->getJson('/api/rikms/bootstrap')->assertOk()->json('agencies'));
        $this->assertFalse($agencies->firstWhere('id', $agency->id)['isActive']);
        $this->assertTrue($agencies->contains('id', $published->agency_id));
        $this->actingAs($user)->get('/api/rikms/public/documents/'.$draft->id.'/download')->assertNotFound();
    }

    public function test_agency_profile_partial_update_preserves_omitted_contact_fields(): void
    {
        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        $user->agency->update(['contact_email' => 'contact@example.org', 'phone' => '123456']);

        $this->actingAs($user)->patchJson('/api/rikms/agency/profile', ['name' => 'Renamed Agency'])->assertOk();
        $agency = $user->agency->fresh();
        $this->assertSame('contact@example.org', $agency->contact_email);
        $this->assertSame('123456', $agency->phone);
    }

    public function test_temporary_password_is_forced_to_rotate_before_protected_access(): void
    {
        $admin = User::query()->where('role', 'super_admin')->firstOrFail();
        $agency = Agency::query()->where('is_active', true)->firstOrFail();
        $response = $this->actingAs($admin)->postJson('/api/rikms/admin/users', [
            'name' => 'New Agency User', 'email' => 'new.user@example.org',
            'password' => 'TemporaryPass123!', 'role' => 'agency_admin', 'agency_id' => $agency->id,
        ])->assertCreated()->assertJsonPath('data.mustChangePassword', true);
        Auth::logout();

        $this->postJson('/login', ['email' => 'new.user@example.org', 'password' => 'TemporaryPass123!', 'agency_id' => $agency->id])
            ->assertOk()->assertJsonPath('redirect', '/change-password');
        $this->getJson('/api/rikms/agency/dashboard')->assertStatus(409)->assertJsonPath('redirect', '/change-password');
        $this->postJson('/api/rikms/change-password', [
            'currentPassword' => 'TemporaryPass123!', 'password' => 'PermanentPass456!',
            'passwordConfirmation' => 'PermanentPass456!',
        ])->assertOk()->assertJsonPath('redirect', '/agency/dashboard');
        $this->getJson('/api/rikms/agency/dashboard')->assertOk();
        $this->assertFalse(User::query()->findOrFail($response->json('data.id'))->must_change_password);
    }
}
