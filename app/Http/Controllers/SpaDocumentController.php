<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\PublicMetadataField;
use App\Models\SdgTag;
use App\Models\Agency;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SpaDocumentController extends Controller
{
    public function __construct(private readonly AuditLogService $audit)
    {
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'document_id' => ['nullable', 'integer', 'exists:documents,id'],
            'document_type' => ['required', 'in:research,terminal,pap'],
            'submit_mode' => ['required', 'in:draft,submit'],
            'title' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:3000'],
            'year' => ['nullable', 'integer', 'between:2020,2035'],
            'quarter' => ['nullable', 'string', 'max:120'],
            'access_mode' => ['nullable', 'in:public,request,restricted,embargo,external'],
            'embargo_until' => ['nullable', 'date'],
            'external_url' => ['nullable', 'url', 'max:2048'],
            'document_file' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
            'highlight_file' => ['nullable', 'file', 'mimes:png,jpg,jpeg,pdf', 'max:10240'],
        ]);

        $user = Auth::user();
        abort_if(! $user, 401);
        $agencyId = $user->agency_id ?? Agency::query()->value('id');
        abort_if(! $agencyId, 422, 'A submitting agency is required before documents can be saved.');

        $metadata = $this->arrayInput($request, 'metadata');
        $publicFields = $this->arrayInput($request, 'public_fields');
        $selectedSdgs = collect($this->arrayInput($request, 'sdg_tags'))->map(fn ($number) => (int) $number)->filter()->values();
        $projects = $this->arrayInput($request, 'projects');
        $pap = $this->arrayInput($request, 'pap');
        $financials = $this->arrayInput($request, 'financials');
        $highlight = $this->arrayInput($request, 'highlight');

        $documentType = match ($validated['document_type']) {
            'terminal' => Document::TERMINAL_REPORT,
            'pap' => Document::PROJECT_ACCOMPLISHMENT_REPORT,
            default => Document::RESEARCH_STUDY,
        };

        $title = $metadata['title'] ?? $validated['title'] ?? 'Untitled research record';
        $status = $validated['submit_mode'] === 'submit' ? 'pending' : 'draft';
        $file = $request->file('document_file');
        $documentId = $request->input('document_id');

        $documentData = [
            'agency_id' => $agencyId,
            'uploaded_by' => $user->id,
            'document_type' => $documentType,
            'title' => $title,
            'description' => $validated['description'] ?? $metadata['abstract'] ?? null,
            'status' => $status,
            'year' => $validated['year'] ?? now()->year,
            'category' => $documentType === Document::RESEARCH_STUDY ? 'Research Study' : $this->categoryFromDocType($documentType),
            'access_mode' => $this->accessMode($validated['access_mode'] ?? 'public'),
            'embargo_until' => $validated['embargo_until'] ?? null,
            'external_url' => $validated['external_url'] ?? null,
            'owner_name' => $user->name,
            'owner_email' => $user->email,
            'is_ai_tagged' => ! empty($metadata),
            'completion_score' => $validated['submit_mode'] === 'submit' ? 100 : 70,
            'digital_library_score' => 70,
            'submitted_at' => $validated['submit_mode'] === 'submit' ? now() : null,
        ];

        if ($file) {
            $documentData['file_path'] = $file->store('research-documents');
            $documentData['original_filename'] = $file->getClientOriginalName();
            $documentData['mime_type'] = $file->getMimeType();
            $documentData['file_size'] = $file->getSize();
        }

        if ($documentId) {
            $document = Document::findOrFail($documentId);
            $this->authorize('update', $document);
            $document->update($documentData);

            // Clean existing relationship rows to prevent duplication on update
            $document->publicFields()->delete();
            $document->performanceRows()->delete();
            $document->papClassifications()->delete();
            $document->financial()?->delete();
            $document->highlights()->delete();
        } else {
            $document = Document::create($documentData);
        }

        $document->metadata()->updateOrCreate(
            ['document_id' => $document->id],
            [
                'title' => $title,
                'abstract' => $metadata['abstract'] ?? null,
                'methodology' => $metadata['methodology'] ?? null,
                'review_of_related_literature' => $metadata['relatedLiterature'] ?? null,
                'theoretical_framework' => $metadata['theoreticalFramework'] ?? null,
                'results_and_discussion' => $metadata['resultsDiscussion'] ?? null,
                'keywords' => $this->splitList($metadata['keywords'] ?? ''),
                'authors' => $this->splitList($metadata['authors'] ?? ''),
                'ai_confidence' => ! empty($metadata) ? 0.88 : null,
                'raw_ai_json' => $metadata ?: null,
            ]
        );

        if ($file) {
            \App\Jobs\ProcessDocumentJob::dispatch($document);
        }

        foreach ($this->metadataFieldMap() as $reactKey => $databaseKey) {
            PublicMetadataField::create([
                'document_id' => $document->id,
                'field_name' => $databaseKey,
                'is_public' => in_array($reactKey, $publicFields, true),
            ]);
        }

        if ($selectedSdgs->isNotEmpty()) {
            $tags = SdgTag::whereIn('number', $selectedSdgs)->get();
            $document->sdgTags()->sync($tags->mapWithKeys(fn (SdgTag $tag) => [
                $tag->id => ['source' => 'manual', 'confidence' => null],
            ])->all());
        }

        foreach ($projects as $index => $project) {
            $indicator = trim((string) ($project['target'] ?? ''));
            if ($indicator === '') {
                continue;
            }

            $document->performanceRows()->create([
                'activity_output_indicator' => $indicator,
                'target' => 100,
                'actual' => (float) ($project['actualPct'] ?? 0),
                'accomplishment_percentage' => (float) ($project['accomplishmentPct'] ?? 0),
                'status' => $this->projectStatus((float) ($project['accomplishmentPct'] ?? 0)),
            ]);
        }

        foreach (($pap['categories'] ?? []) as $category) {
            $document->papClassifications()->create([
                'category' => $this->papCategory((string) $category),
                'description' => $pap['description'] ?? null,
                'beneficiary_government' => in_array('Government', $pap['sectors'] ?? [], true),
                'beneficiary_academe' => in_array('Academe', $pap['sectors'] ?? [], true),
                'beneficiary_business' => in_array('Business', $pap['sectors'] ?? [], true),
                'beneficiary_civil_society' => in_array('Civil Society', $pap['sectors'] ?? [], true),
                'beneficiary_media' => in_array('Media', $pap['sectors'] ?? [], true),
            ]);
        }

        if (isset($financials['allocated']) || isset($financials['used'])) {
            $allocated = (float) ($financials['allocated'] ?? 0);
            $used = (float) ($financials['used'] ?? 0);

            $document->financial()->create([
                'allotted_budget' => $allocated ?: null,
                'utilized_amount' => $used ?: null,
                'remaining_balance' => $allocated ? $allocated - $used : null,
                'budget_utilization_percentage' => $allocated ? round(($used / $allocated) * 100, 2) : null,
                'financial_as_of_date' => now()->toDateString(),
            ]);
        }

        if (($highlight['title'] ?? null) || ($highlight['description'] ?? null) || $request->hasFile('highlight_file')) {
            $document->highlights()->create([
                'title' => $highlight['title'] ?? null,
                'description' => $highlight['description'] ?? null,
                'file_path' => $request->file('highlight_file')?->store('highlight-attachments'),
                'is_featured' => (bool) ($highlight['featured'] ?? false),
            ]);
        }

        $this->audit->log(
            $validated['submit_mode'] === 'submit' ? 'submitted from Figma UI' : 'draft saved from Figma UI',
            $document,
            ['document_type' => $documentType],
            $request
        );

        return response()->json([
            'documentId' => $document->id,
            'status' => $document->status,
            'redirect' => '/agency/research',
        ], 201);
    }

    private function arrayInput(Request $request, string $key): array
    {
        $value = $request->input($key, []);

        if (is_string($value)) {
            $decoded = json_decode($value, true);

            return is_array($decoded) ? $decoded : [];
        }

        return is_array($value) ? $value : [];
    }

    private function splitList(string $value): array
    {
        return collect(explode(',', $value))->map(fn (string $item) => trim($item))->filter()->values()->all();
    }

    private function accessMode(string $mode): string
    {
        return [
            'public' => 'public_download',
            'request' => 'request_access',
            'restricted' => 'restricted_admin',
            'embargo' => 'embargo_until_date',
            'external' => 'external_link_only',
        ][$mode] ?? 'public_download';
    }

    private function categoryFromDocType(string $documentType): string
    {
        return $documentType === Document::TERMINAL_REPORT ? 'Terminal Report' : 'Project Accomplishment Report';
    }

    private function metadataFieldMap(): array
    {
        return [
            'title' => 'title',
            'abstract' => 'abstract',
            'methodology' => 'methodology',
            'relatedLiterature' => 'review_of_related_literature',
            'theoreticalFramework' => 'theoretical_framework',
            'resultsDiscussion' => 'results_and_discussion',
        ];
    }

    private function projectStatus(float $percentage): string
    {
        if ($percentage >= 100) {
            return 'Completed';
        }

        return $percentage > 0 ? 'Ongoing' : 'Not Started';
    }

    private function papCategory(string $id): string
    {
        return [
            'circular' => 'Circular Economy',
            'digital' => 'Digital Economy',
            'ai' => 'Artificial Intelligence',
            'sti' => 'STI Strategy',
            'gad' => 'GAD',
            'youth' => 'Youth',
            'ips' => 'IPs',
            'pwds' => 'PWDs',
            'unserved' => 'Unserved / Underserved',
        ][$id] ?? $id;
    }

    public function runAiAnalysis(Document $document, \App\Services\AiMetadataExtractionService $ai)
    {
        $this->authorize('update', $document);

        $result = $ai->analyze($document);

        return response()->json($result);
    }

    public function uploadDraft(Request $request)
    {
        $request->validate([
            'document_type' => ['required', 'in:research,terminal,pap'],
            'document_file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
        ]);

        $user = Auth::user();
        abort_if(! $user, 401);
        $agencyId = $user->agency_id ?? Agency::query()->value('id');

        $documentType = match ($request->input('document_type')) {
            'terminal' => Document::TERMINAL_REPORT,
            'pap' => Document::PROJECT_ACCOMPLISHMENT_REPORT,
            default => Document::RESEARCH_STUDY,
        };

        $file = $request->file('document_file');

        $document = Document::create([
            'agency_id' => $agencyId,
            'uploaded_by' => $user->id,
            'document_type' => $documentType,
            'title' => 'Draft Upload: ' . $file->getClientOriginalName(),
            'file_path' => $file->store('research-documents'),
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'status' => 'draft',
            'year' => now()->year,
            'category' => $documentType === Document::RESEARCH_STUDY ? 'Research Study' : $this->categoryFromDocType($documentType),
            'access_mode' => 'public_download',
            'owner_name' => $user->name,
            'owner_email' => $user->email,
            'completion_score' => 10,
        ]);

        try {
            $processor = resolve(\App\Services\DocumentProcessingService::class);
            $processor->process($document);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Immediate draft processing failed: " . $e->getMessage());
        }

        return response()->json([
            'document_id' => $document->id,
            'original_filename' => $document->original_filename,
            'file_size' => $document->file_size,
        ]);
    }
}
