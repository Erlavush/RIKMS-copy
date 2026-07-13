<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    public function test_guest_can_view_public_homepage(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('RIKMS');
    }

    public function test_agency_admin_can_view_new_spa_routes(): void
    {
        $user = User::where('email', 'test@example.com')->firstOrFail();

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertRedirect('/agency/dashboard');

        $this->actingAs($user)
            ->get('/repository')
            ->assertRedirect('/agency/research');

        $this->actingAs($user)
            ->get('/agency/dashboard')
            ->assertOk()
            ->assertSee('id="root"', false);

        $this->actingAs($user)
            ->getJson('/api/rikms/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'test@example.com');

        $this->actingAs($user)
            ->get('/agency/research')
            ->assertOk()
            ->assertDontSee('Cybersecurity data science');

        $this->actingAs($user)
            ->getJson('/api/rikms/agency/documents?search=Cybersecurity')
            ->assertOk()
            ->assertJsonFragment([
                'title' => 'Cybersecurity data science: an overview from machine learning perspective',
            ]);
    }

    public function test_agency_admin_can_create_document_from_figma_upload_endpoint(): void
    {
        Storage::fake('local');
        $user = User::where('email', 'test@example.com')->firstOrFail();

        $response = $this->actingAs($user)->post('/api/rikms/documents', [
            'document_type' => 'research',
            'submit_mode' => 'submit',
            'title' => 'Backend saved UI upload',
            'year' => 2026,
            'access_mode' => 'request',
            'metadata' => json_encode([
                'title' => 'Backend saved UI upload',
                'abstract' => 'A real database record created from the Figma upload flow.',
                'methodology' => 'Feature test submission.',
                'relatedLiterature' => '',
                'theoreticalFramework' => '',
                'resultsDiscussion' => '',
                'keywords' => 'RIKMS, Laravel',
                'authors' => 'Agency Admin',
            ]),
            'public_fields' => json_encode(['title', 'abstract']),
            'sdg_tags' => json_encode([9, 16]),
            'projects' => json_encode([]),
            'pap' => json_encode([]),
            'financials' => json_encode([]),
            'highlight' => json_encode([]),
            'document_file' => UploadedFile::fake()->create('research.pdf', 10, 'application/pdf'),
        ]);

        $response->assertCreated()->assertJsonPath('status', 'pending');

        $document = Document::where('title', 'Backend saved UI upload')->firstOrFail();

        $this->assertSame('request_access', $document->access_mode);
        $this->assertCount(2, $document->sdgTags);
        $this->assertDatabaseHas('document_metadata', [
            'document_id' => $document->id,
            'title' => 'Backend saved UI upload',
        ]);
    }
}
