<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentMetadata;
use App\Models\SdgTag;
use App\Models\User;
use App\Support\DocumentStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

class DocumentPersistenceService
{
    private const METADATA_FIELDS = [
        'title', 'abstract', 'methodology', 'review_of_related_literature',
        'theoretical_framework', 'results_and_discussion', 'keywords', 'authors', 'doi',
    ];

    public function __construct(
        private readonly DocumentReadinessService $readiness,
        private readonly DocumentVersionService $versions,
        private readonly DocumentWorkflowService $workflow,
    ) {}

    public function create(array $data, Request $request, User $user): Document
    {
        $paths = [];

        try {
            if ($request->hasFile('document_file')) {
                $paths['document'] = $request->file('document_file')->store('research-documents', DocumentStorage::disk());
            }
            if ($request->hasFile('highlight_file')) {
                $paths['highlight'] = $request->file('highlight_file')->store('highlight-attachments', DocumentStorage::disk());
            }

            return DB::transaction(function () use ($data, $request, $user, $paths): Document {
                $metadata = $data['metadata'] ?? [];
                $agencySettings = $user->agency_id ? ($user->agency->settings ?? []) : [];
                $title = trim((string) ($metadata['title'] ?? $data['title'] ?? '')) ?: 'Untitled research record';
                $submitting = ($data['submit_mode'] ?? 'draft') === 'submit';
                $file = $request->file('document_file');
                // A newly uploaded source must remain editable until a human
                // reviews the queued AI suggestions. AI never auto-submits.
                if ($file && config('rikms.ai.enabled') && config('rikms.ai.auto_queue')) {
                    $submitting = false;
                }

                $document = Document::create([
                    'agency_id' => $user->agency_id,
                    'uploaded_by' => $user->id,
                    'document_type' => $this->documentType($data['document_type']),
                    'title' => $title,
                    'description' => $data['description'] ?? $metadata['abstract'] ?? null,
                    'file_path' => $paths['document'] ?? null,
                    'original_filename' => $file?->getClientOriginalName(),
                    'mime_type' => $file?->getMimeType(),
                    'file_size' => $file?->getSize(),
                    'status' => 'draft',
                    'year' => $data['year'] ?? now()->year,
                    'reporting_quarter' => $data['quarter'] ?? null,
                    'category' => $data['category'] ?? $this->documentTypeLabel($data['document_type']),
                    'access_mode' => $data['access_mode'] ?? ($agencySettings['default_access_mode'] ?? 'request_access'),
                    'embargo_until' => $data['embargo_until'] ?? null,
                    'external_url' => $data['external_url'] ?? null,
                    'owner_name' => $data['owner_name'] ?? $user->name,
                    'owner_email' => $data['owner_email'] ?? $user->email,
                    'notify_access_requests' => $data['notify_access_requests'] ?? ($agencySettings['notify_access_requests'] ?? true),
                    'notify_research_inquiries' => $data['notify_research_inquiries'] ?? false,
                    'send_copy_to_agency_admin' => $data['send_copy_to_agency_admin'] ?? false,
                    'is_ai_tagged' => ! empty($metadata),
                    'submitted_at' => null,
                ]);

                $this->syncNested($document, $data, $paths['highlight'] ?? null);
                $document->load(['metadata', 'sdgTags', 'publicFields']);
                $document->update(['completion_score' => $this->readiness->completionScore($document)]);
                $this->versions->capture($document->fresh(), $user->id, 'Initial draft');
                if ($submitting) {
                    $this->workflow->submit($document->fresh(), $user);
                }

                return $document->fresh($this->relations());
            });
        } catch (Throwable $exception) {
            foreach ($paths as $path) {
                Storage::disk(DocumentStorage::disk())->delete($path);
            }
            throw $exception;
        }
    }

    public function update(Document $document, array $data, Request $request, User $user): Document
    {
        $newPaths = [];

        try {
            if ($request->hasFile('document_file')) {
                $newPaths['document'] = $request->file('document_file')->store('research-documents', DocumentStorage::disk());
            }
            if ($request->hasFile('highlight_file')) {
                $newPaths['highlight'] = $request->file('highlight_file')->store('highlight-attachments', DocumentStorage::disk());
            }

            return DB::transaction(function () use ($document, $data, $request, $user, $newPaths): Document {
                $document = Document::query()->lockForUpdate()->findOrFail($document->id);
                if ($document->status === 'pending') {
                    throw ValidationException::withMessages([
                        'status' => 'A pending record cannot be edited until review is complete.',
                    ]);
                }
                if ($document->status === 'archived') {
                    throw ValidationException::withMessages([
                        'status' => 'Restore this record before editing it.',
                    ]);
                }

                $this->versions->capture($document, $user->id, $data['change_summary'] ?? 'Before document update');

                $metadata = $data['metadata'] ?? [];
                $attributes = Arr::only($data, [
                    'title', 'description', 'year', 'category', 'access_mode', 'embargo_until',
                    'external_url', 'owner_name', 'owner_email', 'notify_access_requests',
                    'notify_research_inquiries', 'send_copy_to_agency_admin',
                ]);
                if (array_key_exists('quarter', $data)) {
                    $attributes['reporting_quarter'] = $data['quarter'];
                }
                if (array_key_exists('document_type', $data)) {
                    $attributes['document_type'] = $this->documentType($data['document_type']);
                }
                if (! empty($metadata['title'])) {
                    $attributes['title'] = $metadata['title'];
                }
                if (isset($newPaths['document'])) {
                    $file = $request->file('document_file');
                    $attributes += [
                        'file_path' => $newPaths['document'],
                        'original_filename' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                        'hash' => null,
                        'integrity_status' => 'pending',
                        'malware_status' => 'pending',
                        'processing_status' => 'pending',
                        'extraction_method' => null,
                        'extracted_text' => null,
                        'processing_error' => null,
                    ];
                    $document->chunks()->delete();
                }

                // Editing an approved record always creates a new review-gated draft.
                if ($document->status === 'published') {
                    $attributes += [
                        'status' => 'draft', 'submitted_at' => null, 'published_at' => null,
                        'reviewed_by' => null, 'reviewed_at' => null, 'rejection_reason' => null,
                    ];
                }

                $document->update($attributes);
                $this->syncNested($document, $data, $newPaths['highlight'] ?? null, false);
                $document->load(['metadata', 'sdgTags', 'publicFields']);
                $document->update(['completion_score' => $this->readiness->completionScore($document)]);

                return $document->fresh($this->relations());
            });
        } catch (Throwable $exception) {
            foreach ($newPaths as $path) {
                Storage::disk(DocumentStorage::disk())->delete($path);
            }
            throw $exception;
        }
    }

    private function syncNested(Document $document, array $data, ?string $highlightPath = null, bool $creating = true): void
    {
        if ($creating || array_key_exists('metadata', $data)) {
            $metadata = $data['metadata'] ?? [];
            $attributes = Arr::only($metadata, self::METADATA_FIELDS);
            if ($creating) {
                $attributes['title'] ??= $document->title;
                $attributes['keywords'] = $this->list($attributes['keywords'] ?? []);
                $attributes['authors'] = $this->list($attributes['authors'] ?? []);
            } else {
                if (array_key_exists('keywords', $attributes)) {
                    $attributes['keywords'] = $this->list($attributes['keywords']);
                }
                if (array_key_exists('authors', $attributes)) {
                    $attributes['authors'] = $this->list($attributes['authors']);
                }
            }
            if ($creating && ! empty($metadata)) {
                $attributes['ai_confidence'] = 0.88;
                $attributes['raw_ai_json'] = $metadata;
            }
            $documentMetadata = DocumentMetadata::query()->firstOrNew(['document_id' => $document->id]);
            $documentMetadata->fill($attributes);
            $documentMetadata->save();
        }

        if ($creating || array_key_exists('public_fields', $data)) {
            $selected = $data['public_fields'] ?? [];
            $selected[] = 'title';
            $selected = array_values(array_unique($selected));
            foreach (self::METADATA_FIELDS as $field) {
                $document->publicFields()->updateOrCreate(
                    ['field_name' => $field],
                    ['is_public' => in_array($field, $selected, true)]
                );
            }
        }

        if ($creating || array_key_exists('sdg_tags', $data)) {
            $tags = SdgTag::query()->whereIn('number', $data['sdg_tags'] ?? [])->get();
            $document->sdgTags()->sync($tags->mapWithKeys(fn (SdgTag $tag) => [
                $tag->id => ['source' => 'manual', 'confidence' => null],
            ])->all());
        }

        if ($creating || array_key_exists('projects', $data)) {
            $document->performanceRows()->delete();
            foreach ($data['projects'] ?? [] as $project) {
                $indicator = trim((string) ($project['target'] ?? ''));
                if ($indicator === '') {
                    continue;
                }
                $percentage = (float) ($project['accomplishmentPct'] ?? 0);
                $document->performanceRows()->create([
                    'activity_output_indicator' => $indicator,
                    'target' => 100,
                    'actual' => (float) ($project['actualPct'] ?? 0),
                    'accomplishment_percentage' => $percentage,
                    'status' => $percentage >= 100 ? 'Completed' : ($percentage > 0 ? 'Ongoing' : 'Not Started'),
                ]);
            }
        }

        if ($creating || array_key_exists('pap', $data)) {
            $document->papClassifications()->delete();
            $pap = $data['pap'] ?? [];
            foreach ($pap['categories'] ?? [] as $category) {
                $sectors = $pap['sectors'] ?? [];
                $document->papClassifications()->create([
                    'category' => $this->papCategory((string) $category),
                    'description' => $pap['description'] ?? null,
                    'beneficiary_government' => in_array('Government', $sectors, true),
                    'beneficiary_academe' => in_array('Academe', $sectors, true),
                    'beneficiary_business' => in_array('Business', $sectors, true),
                    'beneficiary_civil_society' => in_array('Civil Society', $sectors, true),
                    'beneficiary_media' => in_array('Media', $sectors, true),
                ]);
            }
        }

        if ($creating || array_key_exists('financials', $data)) {
            $financials = $data['financials'] ?? [];
            $existing = $document->financial;
            $allocated = array_key_exists('allocated', $financials) ? (float) $financials['allocated'] : ($existing ? (float) $existing->allotted_budget : 0.0);
            $released = array_key_exists('released', $financials) ? (float) $financials['released'] : $existing?->released_amount;
            $obligated = array_key_exists('obligated', $financials) ? (float) $financials['obligated'] : $existing?->obligated_amount;
            $used = array_key_exists('used', $financials) ? (float) $financials['used'] : ($existing ? (float) $existing->utilized_amount : 0.0);
            $asOfDate = $financials['asOfDate'] ?? $existing?->financial_as_of_date?->toDateString();
            $meaningful = $allocated > 0 || (float) $released > 0 || (float) $obligated > 0 || $used > 0 || $asOfDate;
            if ($meaningful) {
                $document->financial()->updateOrCreate([], [
                    'allotted_budget' => $allocated,
                    'released_amount' => $released,
                    'obligated_amount' => $obligated,
                    'utilized_amount' => $used,
                    'remaining_balance' => $allocated - $used,
                    'budget_utilization_percentage' => $allocated > 0 ? round(($used / $allocated) * 100, 2) : 0,
                    'financial_as_of_date' => $asOfDate ?? now()->toDateString(),
                ]);
            }
        }

        if ($creating || array_key_exists('highlight', $data) || $highlightPath) {
            $highlight = $data['highlight'] ?? [];
            $meaningful = trim((string) ($highlight['title'] ?? '')) !== ''
                || trim((string) ($highlight['description'] ?? '')) !== '' || $highlightPath;
            if ($meaningful) {
                $document->highlights()->create([
                    'title' => $highlight['title'] ?? null,
                    'description' => $highlight['description'] ?? null,
                    'file_path' => $highlightPath,
                    'is_featured' => (bool) ($highlight['featured'] ?? false),
                ]);
            }
        }
    }

    private function list(mixed $value): array
    {
        if (is_array($value)) {
            return collect($value)->map(fn ($item) => trim((string) $item))->filter()->values()->all();
        }

        return collect(preg_split('/[,;\n]+/', (string) $value))->map(fn ($item) => trim($item))->filter()->values()->all();
    }

    private function documentType(string $type): string
    {
        return match ($type) {
            'terminal', Document::TERMINAL_REPORT => Document::TERMINAL_REPORT,
            'pap', Document::PROJECT_ACCOMPLISHMENT_REPORT => Document::PROJECT_ACCOMPLISHMENT_REPORT,
            default => Document::RESEARCH_STUDY,
        };
    }

    private function documentTypeLabel(string $type): string
    {
        return match ($this->documentType($type)) {
            Document::TERMINAL_REPORT => 'Terminal Report',
            Document::PROJECT_ACCOMPLISHMENT_REPORT => 'Project Accomplishment Report',
            default => 'Research Study',
        };
    }

    private function papCategory(string $id): string
    {
        return [
            'circular' => 'Circular Economy', 'digital' => 'Digital Economy',
            'ai' => 'Artificial Intelligence', 'sti' => 'STI Strategy', 'gad' => 'GAD',
            'youth' => 'Youth', 'ips' => 'IPs', 'pwds' => 'PWDs',
            'unserved' => 'Unserved / Underserved',
        ][$id] ?? $id;
    }

    private function relations(): array
    {
        return [
            'metadata', 'publicFields', 'sdgTags', 'agency', 'uploader', 'performanceRows',
            'financial', 'papClassifications', 'highlights',
        ];
    }
}
