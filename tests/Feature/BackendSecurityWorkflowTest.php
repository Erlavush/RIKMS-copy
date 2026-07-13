<?php

namespace Tests\Feature;

use App\Models\Agency;
use App\Models\Document;
use App\Models\DownloadGrant;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\DocumentPersistenceService;
use App\Services\DocumentVersionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class BackendSecurityWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    public function test_public_bootstrap_contains_only_published_sanitized_data(): void
    {
        $pending = Document::query()->where('status', 'pending')->firstOrFail();

        $response = $this->getJson('/api/rikms/bootstrap')->assertOk();

        $ids = collect($response->json('researchData'))->pluck('id');
        $this->assertFalse($ids->contains($pending->id));
        $response->assertJsonMissingPath('accessRequests')->assertJsonMissingPath('auditLogs');
        $this->assertStringNotContainsString('juan@example.com', $response->getContent());
    }

    public function test_public_search_does_not_infer_private_metadata_fields(): void
    {
        $document = Document::query()->where('status', 'published')->firstOrFail();
        $document->metadata()->update(['authors' => ['Public Author'], 'keywords' => ['secret-needle']]);
        $document->publicFields()->updateOrCreate(['field_name' => 'authors'], ['is_public' => true]);
        $document->publicFields()->updateOrCreate(['field_name' => 'keywords'], ['is_public' => false]);

        $this->getJson('/api/rikms/public/documents?search=secret-needle')
            ->assertOk()->assertJsonPath('meta.total', 0);
        $this->getJson('/api/rikms/public/documents?search=Public%20Author')
            ->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_role_boundaries_and_agency_isolation_are_enforced(): void
    {
        $agencyUser = User::query()->where('email', 'test@example.com')->firstOrFail();
        $super = User::query()->where('role', 'super_admin')->firstOrFail();
        $otherAgency = Agency::query()->whereKeyNot($agencyUser->agency_id)->firstOrFail();
        $otherUser = User::factory()->create(['role' => 'agency_admin', 'agency_id' => $otherAgency->id, 'is_active' => true]);
        $privateDocument = Document::query()->where('agency_id', $agencyUser->agency_id)->firstOrFail();

        $this->actingAs($agencyUser)->getJson('/api/rikms/admin/dashboard')->assertForbidden();
        $this->actingAs($super)->getJson('/api/rikms/agency/dashboard')->assertForbidden();
        $this->actingAs($otherUser)->getJson('/api/rikms/agency/documents/'.$privateDocument->id)->assertForbidden();
    }

    public function test_submit_without_file_rolls_back_and_status_cannot_be_forged(): void
    {
        $user = User::query()->where('email', 'test@example.com')->firstOrFail();

        $this->actingAs($user)->postJson('/api/rikms/documents', [
            'document_type' => 'research', 'submit_mode' => 'submit',
            'metadata' => ['title' => 'No file submission', 'authors' => [], 'keywords' => []],
            'public_fields' => ['title'], 'sdg_tags' => [], 'access_mode' => 'request_access',
        ])->assertUnprocessable()->assertJsonValidationErrors('document_file');
        $this->assertDatabaseMissing('documents', ['title' => 'No file submission']);

        $draft = Document::query()->where('status', 'draft')->firstOrFail();
        $this->actingAs($user)->patchJson('/api/rikms/agency/documents/'.$draft->id, [
            'status' => 'published',
        ])->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->assertSame('draft', $draft->fresh()->status);
    }

    public function test_only_super_admin_can_moderate_pending_documents(): void
    {
        Notification::fake();
        Storage::fake('local');
        $agencyUser = User::query()->where('email', 'test@example.com')->firstOrFail();
        $super = User::query()->where('role', 'super_admin')->firstOrFail();
        $pending = Document::query()->where('status', 'pending')->firstOrFail();
        Storage::disk('local')->put('research-documents/pending.pdf', 'pending');
        $pending->update(['file_path' => 'research-documents/pending.pdf', 'original_filename' => 'pending.pdf']);

        $this->actingAs($agencyUser)->postJson('/api/rikms/admin/documents/'.$pending->id.'/approve')->assertForbidden();
        $this->actingAs($super)->postJson('/api/rikms/admin/documents/'.$pending->id.'/approve')
            ->assertOk()->assertJsonPath('data.status', 'published');

        $pending->refresh();
        $this->assertSame('published', $pending->status);
        $this->assertSame($super->id, $pending->reviewed_by);
        $this->assertNotNull($pending->published_at);
    }

    public function test_access_approval_creates_limited_signed_download_grant_and_dedupes(): void
    {
        Notification::fake();
        Storage::fake('local');
        $agencyUser = User::query()->where('email', 'test@example.com')->firstOrFail();
        $document = Document::query()->where('status', 'published')->firstOrFail();
        Storage::disk('local')->put('research-documents/available.pdf', 'pdf-content');
        $document->update([
            'access_mode' => 'request_access', 'file_path' => 'research-documents/available.pdf',
            'original_filename' => 'available.pdf', 'mime_type' => 'application/pdf', 'file_size' => 11,
        ]);

        $payload = [
            'requester_name' => 'External Researcher', 'requester_email' => 'external@example.org',
            'requester_organization' => 'Research Institute', 'message' => 'Needed for a comparative research review.',
        ];
        $requestId = $this->postJson('/api/rikms/public/documents/'.$document->id.'/access-requests', $payload)
            ->assertCreated()->json('data.id');

        $decision = $this->actingAs($agencyUser)
            ->postJson('/api/rikms/agency/access-requests/'.$requestId.'/approve', ['reason' => 'Approved for research use.'])
            ->assertOk();
        $downloadUrl = $decision->json('downloadUrl');
        $this->assertNotEmpty($downloadUrl);
        $this->assertDatabaseHas('download_grants', ['access_request_id' => $requestId, 'download_count' => 0]);

        $this->postJson('/api/rikms/public/documents/'.$document->id.'/access-requests', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('requester_email');
        Auth::logout();
        $this->get($downloadUrl)->assertOk();
        $this->assertSame(1, DownloadGrant::query()->where('access_request_id', $requestId)->value('download_count'));
    }

    public function test_version_restore_rejects_version_from_another_document(): void
    {
        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        [$first, $second] = Document::query()->where('agency_id', $user->agency_id)->limit(2)->get();
        $version = app(DocumentVersionService::class)->capture($second, $user->id, 'Other document version');

        $this->actingAs($user)->postJson(
            '/api/rikms/documents/'.$first->id.'/versions/'.$version->id.'/restore'
        )->assertNotFound();
        $this->assertSame($first->title, $first->fresh()->title);
    }

    public function test_rbac_permission_changes_are_persisted_and_enforced(): void
    {
        $agencyUser = User::query()->where('email', 'test@example.com')->firstOrFail();
        $role = Role::query()->where('name', 'agency_admin')->firstOrFail();
        $role->permissions()->detach();

        $this->actingAs($agencyUser)->postJson('/api/rikms/documents', [
            'document_type' => 'research', 'submit_mode' => 'draft',
        ])->assertForbidden();
    }

    public function test_dashboard_omits_access_request_pii_without_manage_permission(): void
    {
        $agencyUser = User::query()->where('email', 'test@example.com')->firstOrFail();
        $role = Role::query()->where('name', 'agency_admin')->firstOrFail();
        $permission = Permission::query()->where('name', 'access_requests.manage')->firstOrFail();
        $role->permissions()->detach($permission->id);

        $this->actingAs($agencyUser)->getJson('/api/rikms/agency/dashboard')
            ->assertOk()
            ->assertJsonPath('data.statistics.pendingAccessRequests', 0)
            ->assertJsonPath('data.pendingAccessRequests', []);
    }

    public function test_version_restore_rejects_pending_and_archived_records(): void
    {
        Notification::fake();
        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        $versions = app(DocumentVersionService::class);

        $pending = Document::query()->where('agency_id', $user->agency_id)->where('status', 'pending')->firstOrFail();
        $pendingVersion = $versions->capture($pending, $user->id, 'Pending snapshot');
        $this->actingAs($user)->postJson(
            "/api/rikms/agency/documents/{$pending->id}/versions/{$pendingVersion->id}/restore"
        )->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->assertSame('pending', $pending->fresh()->status);

        $draft = Document::query()->where('agency_id', $user->agency_id)->where('status', 'draft')->firstOrFail();
        $draftVersion = $versions->capture($draft, $user->id, 'Pre-archive snapshot');
        $this->actingAs($user)->deleteJson("/api/rikms/agency/documents/{$draft->id}")->assertOk();
        $this->actingAs($user)->postJson(
            "/api/rikms/agency/documents/{$draft->id}/versions/{$draftVersion->id}/restore"
        )->assertUnprocessable()->assertJsonValidationErrors('status');
        $draft->refresh();
        $this->assertSame('archived', $draft->status);
        $this->assertNotNull($draft->archived_at);
        $this->assertNotNull($draft->pre_archive_status);
    }

    public function test_allowed_version_restore_normalizes_review_and_archive_state(): void
    {
        Notification::fake();
        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        $document = Document::query()->where('agency_id', $user->agency_id)->where('status', 'published')->firstOrFail();
        $version = app(DocumentVersionService::class)->capture($document, $user->id, 'Published snapshot');
        $document->update(['pre_archive_status' => 'published', 'archived_at' => now()->subDay()]);

        $this->actingAs($user)->postJson(
            "/api/rikms/agency/documents/{$document->id}/versions/{$version->id}/restore"
        )->assertOk()->assertJsonPath('data.status', 'draft');

        $document->refresh();
        $this->assertSame('draft', $document->status);
        $this->assertNull($document->published_at);
        $this->assertNull($document->reviewed_at);
        $this->assertNull($document->reviewed_by);
        $this->assertNull($document->rejection_reason);
        $this->assertNull($document->pre_archive_status);
        $this->assertNull($document->archived_at);
    }

    public function test_document_update_revalidates_locked_database_status(): void
    {
        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        $staleDocument = Document::query()->where('agency_id', $user->agency_id)->where('status', 'draft')->firstOrFail();
        $originalTitle = $staleDocument->title;
        $versionCount = $staleDocument->versions()->count();
        DB::table('documents')->where('id', $staleDocument->id)->update(['status' => 'pending']);
        $request = Request::create('/api/rikms/agency/documents/'.$staleDocument->id, 'PATCH');
        $request->setUserResolver(fn () => $user);

        try {
            app(DocumentPersistenceService::class)->update(
                $staleDocument, ['title' => 'Stale overwrite attempt'], $request, $user
            );
            $this->fail('The locked status revalidation should reject the stale update.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('status', $exception->errors());
        }

        $staleDocument->refresh();
        $this->assertSame('pending', $staleDocument->status);
        $this->assertSame($originalTitle, $staleDocument->title);
        $this->assertSame($versionCount, $staleDocument->versions()->count());
    }
}
