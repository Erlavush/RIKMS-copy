<?php

namespace Database\Seeders;

use App\Models\AccessRequest;
use App\Models\Agency;
use App\Models\Document;
use App\Models\PublicMetadataField;
use App\Models\SdgTag;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $agency = Agency::create([
            'name' => 'Department of Science and Technology - Region XI',
            'region' => 'Davao Region - RIKMS XI',
            'contact_email' => 'owner@agency.gov.ph',
        ]);

        foreach ($this->participatingAgencies() as $agencyData) {
            Agency::firstOrCreate(['name' => $agencyData['name']], $agencyData);
        }

        $user = User::create([
            'name' => 'test',
            'email' => 'test@example.com',
            'password' => Hash::make('password'),
            'role' => 'agency_admin',
            'agency_id' => $agency->id,
        ]);

        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@rikms.gov.ph',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'agency_id' => null,
        ]);

        $this->seedSdgs();

        $samples = [
            [
                'title' => 'Cybersecurity data science: an overview from machine learning perspective',
                'authors' => ['Iqbal H. Sarker', 'A. S. M. Kayes', 'Shahriar Badsha', 'Hamed Alqahtani', 'Paul Watters', 'Alex Ng'],
                'abstract' => 'In a computing context, cybersecurity is undergoing massive shifts in technology and its operations in recent days, and data science is driving the change.',
                'type' => Document::RESEARCH_STUDY,
                'status' => 'pending',
                'access' => 'request_access',
                'category' => 'Uncategorized',
                'completion' => 100,
                'sdgs' => [9, 16, 8],
                'updated_at' => '2026-06-18 09:00:00',
            ],
            [
                'title' => 'Changes-in-thyroid-function-of-nesting-tree-swallowS--Tachycin_2019_Environ',
                'authors' => ['test'],
                'abstract' => 'A repository draft for environmental physiology and nesting tree swallow thyroid function.',
                'type' => Document::RESEARCH_STUDY,
                'status' => 'draft',
                'access' => 'public_download',
                'category' => 'Uncategorized',
                'completion' => 80,
                'sdgs' => [],
                'updated_at' => '2026-07-06 10:00:00',
            ],
            [
                'title' => 'NEAR-REALTIME TRACKING USING GIS AND THERMAL SENSING TECHNOLOGY FOR Foc TR4 DETECTION AND PREDICTION DISPERSAL IN BANANA',
                'authors' => ['CECARLY G. PUIG', 'GILBERT A. IMPORTANTE', 'JAMES JADE A. LASQUITES', 'IVY MACHICA'],
                'abstract' => 'Fusarium wilt, Fusarium oxysporum f. sp. cubense Tropical Race 4 (FocTR4), poses serious risks to banana production and regional livelihoods.',
                'type' => Document::TERMINAL_REPORT,
                'status' => 'pending',
                'access' => 'request_access',
                'category' => 'Terminal Report',
                'completion' => 80,
                'sdgs' => [9, 17],
                'updated_at' => '2026-06-20 10:00:00',
            ],
            [
                'title' => 'TERMINAL-REPORT_FocTR4_GIS-ThermalSensing-Project-Accomplishment',
                'authors' => ['IVY MACHICA <ilmachica@usep.edu.ph>'],
                'abstract' => 'A digital economy project accomplishment report for GIS and thermal sensing activities.',
                'type' => Document::PROJECT_ACCOMPLISHMENT_REPORT,
                'status' => 'draft',
                'access' => 'request_access',
                'category' => 'Digital Economy',
                'completion' => 74,
                'sdgs' => [9, 17, 11],
                'updated_at' => '2026-06-19 10:00:00',
            ],
        ];

        foreach ($samples as $sample) {
            $this->createDocument($agency, $user, $sample);
        }

        for ($i = 5; $i <= 38; $i++) {
            $published = $i >= 5 && $i <= 17;
            $draft = $i >= 18 && $i <= 30;
            $type = $i % 5 === 0 ? Document::TERMINAL_REPORT : Document::RESEARCH_STUDY;
            $category = $type === Document::TERMINAL_REPORT ? 'Terminal Report' : ['Uncategorized', 'Sustainable Energy', 'Digital Economy'][$i % 3];

            $this->createDocument($agency, $user, [
                'title' => "Regional Innovation Knowledge Asset {$i}",
                'authors' => ["DOST XI Research Team {$i}", 'Agency Collaborator'],
                'abstract' => 'Seeded repository record used to demonstrate RIKMS filtering, analytics, AI tagging, SDG tagging, completion scores, and access workflows.',
                'type' => $type,
                'status' => $published ? 'published' : ($draft ? 'draft' : 'pending'),
                'access' => $i % 4 === 0 ? 'public_download' : 'request_access',
                'category' => $category,
                'completion' => $published ? 100 : 80,
                'digital' => 70,
                'ai' => $i !== 38,
                'sdgs' => [($i % 13) + 1],
                'updated_at' => now()->subDays($i)->format('Y-m-d H:i:s'),
            ]);
        }

        AccessRequest::create([
            'document_id' => Document::where('access_mode', 'request_access')->first()->id,
            'requester_id' => $user->id,
            'requester_name' => 'test',
            'requester_email' => 'test@example.com',
            'message' => 'Requesting access for review and class reference.',
            'status' => 'pending',
        ]);

        AccessRequest::create([
            'document_id' => Document::where('access_mode', 'request_access')->skip(1)->first()->id,
            'requester_name' => 'Juan Researcher',
            'requester_email' => 'juan@example.com',
            'message' => 'Please grant access to support related research.',
            'status' => 'pending',
        ]);
    }

    private function seedSdgs(): void
    {
        $sdgs = [
            [1, 'No Poverty', 'No Poverty', '#DC2626'],
            [2, 'Zero Hunger', 'Zero Hunger', '#D6A600'],
            [3, 'Good Health', 'Good Health', '#22C55E'],
            [4, 'Quality Education', 'Quality Edu.', '#B91C1C'],
            [5, 'Gender Equality', 'Gender Eq.', '#F97316'],
            [6, 'Clean Water', 'Clean Water', '#06B6D4'],
            [7, 'Clean Energy', 'Clean Energy', '#FACC15'],
            [8, 'Decent Work', 'Decent Work', '#BE185D'],
            [9, 'Industry', 'Industry', '#F97316'],
            [10, 'Reduced Inequalities', 'Reduced Ineq.', '#EC4899'],
            [11, 'Sustainable Cities', 'Sust. Cities', '#EA580C'],
            [12, 'Responsible Consumption', 'Resp. Consump.', '#B7791F'],
            [13, 'Climate', 'Climate', '#166534'],
            [14, 'Life Below Water', 'Life Below Water', '#2563EB'],
            [15, 'Life on Land', 'Life on Land', '#4CAF50'],
            [16, 'Peace & Justice', 'Peace & Justice', '#0F4C81'],
            [17, 'Partnerships', 'Partnerships', '#1D4ED8'],
        ];

        foreach ($sdgs as [$number, $name, $short, $color]) {
            SdgTag::create([
                'number' => $number,
                'name' => $name,
                'short_name' => $short,
                'color' => $color,
            ]);
        }
    }

    private function participatingAgencies(): array
    {
        return [
            [
                'name' => 'Commission on Higher Education - Region XI',
                'region' => 'Davao Region - Higher Education',
                'contact_email' => 'chedxi@example.gov.ph',
            ],
            [
                'name' => 'National Economic and Development Authority - Region XI',
                'region' => 'Davao Region - Socioeconomic Planning',
                'contact_email' => 'nedaxi@example.gov.ph',
            ],
            [
                'name' => 'Department of Trade and Industry - Region XI',
                'region' => 'Davao Region - Trade and Industry',
                'contact_email' => 'dtixi@example.gov.ph',
            ],
            [
                'name' => 'Department of Information and Communications Technology - Region XI',
                'region' => 'Davao Region - ICT Development',
                'contact_email' => 'dictxi@example.gov.ph',
            ],
            [
                'name' => 'Regional Health Research and Development Consortium XI',
                'region' => 'Davao Region - Health Research',
                'contact_email' => 'rhrdcxi@example.org',
            ],
            [
                'name' => 'Davao Region Industry Energy and Emerging Technology Research and Development Consortium',
                'region' => 'Davao Region - Industry, Energy, and Emerging Technology',
                'contact_email' => 'drieerdc@example.org',
            ],
            [
                'name' => 'Southern Mindanao Agriculture Aquatic and Natural Resources Research and Development Consortium',
                'region' => 'Southern Mindanao - Agriculture, Aquatic, and Natural Resources',
                'contact_email' => 'smaarrdec@example.org',
            ],
            [
                'name' => 'University of Southeastern Philippines',
                'region' => 'Davao Region - Higher Education Institution',
                'contact_email' => 'research@usep.edu.ph',
            ],
        ];
    }

    private function createDocument(Agency $agency, User $user, array $data): Document
    {
        $document = Document::create([
            'agency_id' => $agency->id,
            'uploaded_by' => $user->id,
            'document_type' => $data['type'],
            'title' => $data['title'],
            'description' => $data['abstract'],
            'file_path' => 'research-documents/'.Str::slug($data['title']).'.pdf',
            'original_filename' => Str::limit(Str::slug($data['title'], '-'), 90, '').'.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 2457600,
            'status' => $data['status'],
            'year' => 2026,
            'category' => $data['category'],
            'access_mode' => $data['access'],
            'owner_name' => 'Research Owner Name',
            'owner_email' => 'owner@agency.gov.ph',
            'notify_access_requests' => true,
            'is_ai_tagged' => $data['ai'] ?? true,
            'completion_score' => $data['completion'],
            'digital_library_score' => $data['digital'] ?? 70,
            'submitted_at' => in_array($data['status'], ['pending', 'published'], true) ? now()->subDays(10) : null,
            'published_at' => $data['status'] === 'published' ? now()->subDays(5) : null,
            'created_at' => $data['updated_at'],
            'updated_at' => $data['updated_at'],
        ]);

        $document->metadata()->create([
            'title' => $data['title'],
            'abstract' => $data['abstract'],
            'methodology' => 'The document uses agency research methods, field validation, data collection, and repository-ready reporting to support evidence-based program review.',
            'review_of_related_literature' => 'Related work covers regional research management, innovation systems, program monitoring, and knowledge repository practices.',
            'theoretical_framework' => 'The work is grounded in research utilization, innovation diffusion, and public-sector knowledge management.',
            'results_and_discussion' => 'Results demonstrate how structured records improve discovery, access management, and institutional reporting.',
            'keywords' => ['Research', 'Innovation', 'Knowledge Management', 'Repository'],
            'authors' => $data['authors'],
            'ai_confidence' => 0.84,
        ]);

        foreach (['title', 'abstract', 'methodology', 'results_and_discussion'] as $field) {
            PublicMetadataField::create([
                'document_id' => $document->id,
                'field_name' => $field,
                'is_public' => in_array($field, ['title', 'abstract', 'methodology'], true),
            ]);
        }

        $tags = SdgTag::whereIn('number', $data['sdgs'])->get();
        $document->sdgTags()->sync($tags->mapWithKeys(fn (SdgTag $tag) => [$tag->id => ['source' => 'ai_suggested', 'confidence' => 0.82]])->all());

        return $document;
    }
}
