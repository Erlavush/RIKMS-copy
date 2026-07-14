<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\User;
use App\Models\Agency;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BrokenAccessControlTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    /**
     * Assert that a user cannot download draft or private documents from other agencies (BOLA/IDOR validation).
     */
    public function test_cross_agency_document_isolation_enforced(): void
    {
        // Setup two different agencies
        $agency1 = Agency::firstOrCreate(['name' => 'Agency One']);
        $user1 = User::factory()->create([
            'agency_id' => $agency1->id,
            'name' => 'User One',
            'email' => 'user1@example.com',
            'role' => 'agency_admin',
            'must_change_password' => false,
            'is_active' => true,
        ]);

        $agency2 = Agency::create(['name' => 'Agency Two']);
        $user2 = User::factory()->create([
            'agency_id' => $agency2->id,
            'name' => 'User Two',
            'email' => 'user2@example.com',
            'role' => 'agency_admin',
            'must_change_password' => false,
            'is_active' => true,
        ]);

        // Create a document owned by Agency 2
        $document = Document::create([
            'agency_id' => $agency2->id,
            'uploaded_by' => $user2->id,
            'document_type' => Document::RESEARCH_STUDY,
            'title' => 'Sensitive Agency Two Research',
            'file_path' => 'research-documents/secret.pdf',
            'original_filename' => 'secret.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'access_mode' => 'restricted_admin',
            'status' => 'published',
        ]);

        // Attempting to download from user1 (from Agency 1) should yield 403 Forbidden
        $response = $this->actingAs($user1)->getJson("/api/rikms/agency/documents/{$document->id}/download");
        $response->assertStatus(403);
    }

    /**
     * Assert that a user from another agency cannot approve or reject another agency's document.
     */
    public function test_cross_agency_document_actions_denied(): void
    {
        // Setup two different agencies
        $agency1 = Agency::firstOrCreate(['name' => 'Agency One']);
        $user1 = User::factory()->create([
            'agency_id' => $agency1->id,
            'name' => 'User One',
            'email' => 'user1@example.com',
            'role' => 'agency_admin',
            'must_change_password' => false,
            'is_active' => true,
        ]);

        $agency2 = Agency::create(['name' => 'Agency Two']);
        $user2 = User::factory()->create([
            'agency_id' => $agency2->id,
            'name' => 'User Two',
            'email' => 'user2@example.com',
            'role' => 'agency_admin',
            'must_change_password' => false,
            'is_active' => true,
        ]);

        // Create a pending document owned by Agency 2
        $document = Document::create([
            'agency_id' => $agency2->id,
            'uploaded_by' => $user2->id,
            'document_type' => Document::RESEARCH_STUDY,
            'title' => 'Pending Agency Two Research',
            'file_path' => 'research-documents/pending.pdf',
            'original_filename' => 'pending.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'access_mode' => 'request_access',
            'status' => 'pending',
        ]);

        // Attempting to approve from user1 (from Agency 1) should yield 403 Forbidden
        $approveResponse = $this->actingAs($user1)->postJson("/api/rikms/documents/{$document->id}/approve");
        $approveResponse->assertStatus(403);

        // Attempting to reject from user1 (from Agency 1) should yield 403 Forbidden
        $rejectResponse = $this->actingAs($user1)->postJson("/api/rikms/documents/{$document->id}/reject", ['reason' => 'Unauthorized']);
        $rejectResponse->assertStatus(403);
    }
}
