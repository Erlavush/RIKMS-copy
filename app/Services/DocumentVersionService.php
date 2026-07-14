<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\SdgTag;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DocumentVersionService
{
    public function __construct(private readonly DocumentReadinessService $readiness) {}

    public function capture(Document $document, ?int $userId, ?string $summary = null): DocumentVersion
    {
        return DB::transaction(function () use ($document, $userId, $summary): DocumentVersion {
            $locked = Document::query()->lockForUpdate()->findOrFail($document->id);
            $locked->load([
                'metadata', 'publicFields', 'sdgTags', 'performanceRows', 'financial',
                'papClassifications', 'highlights',
            ]);
            $version = (int) DocumentVersion::query()->where('document_id', $locked->id)->max('version_number') + 1;

            return DocumentVersion::create([
                'document_id' => $locked->id,
                'version_number' => $version,
                'snapshot' => [
                    'document' => $locked->only([
                        'document_type', 'title', 'description', 'status', 'year', 'reporting_quarter',
                        'category', 'access_mode', 'embargo_until', 'external_url', 'owner_name',
                        'owner_email', 'notify_access_requests', 'notify_research_inquiries',
                        'send_copy_to_agency_admin', 'is_ai_tagged', 'completion_score',
                        'digital_library_score', 'submitted_at', 'published_at',
                    ]),
                    'metadata' => $locked->metadata?->toArray(),
                    'public_fields' => $locked->publicFields->map->only(['field_name', 'is_public'])->values()->all(),
                    'sdg_tags' => $locked->sdgTags->pluck('number')->values()->all(),
                    'performance_rows' => $locked->performanceRows->map->only([
                        'activity_output_indicator', 'target', 'actual', 'accomplishment_percentage', 'status',
                    ])->values()->all(),
                    'financial' => $locked->financial?->toArray(),
                    'pap_classifications' => $locked->papClassifications->map->only([
                        'category', 'description', 'beneficiary_government', 'beneficiary_academe',
                        'beneficiary_business', 'beneficiary_civil_society', 'beneficiary_media',
                    ])->values()->all(),
                    'highlights' => $locked->highlights->map->only([
                        'title', 'description', 'file_path', 'is_featured',
                    ])->values()->all(),
                ],
                'file_path' => $locked->file_path,
                'original_filename' => $locked->original_filename,
                'mime_type' => $locked->mime_type,
                'file_size' => $locked->file_size,
                'change_summary' => $summary,
                'created_by' => $userId,
            ]);
        });
    }

    public function restore(Document $document, DocumentVersion $version): void
    {
        abort_unless((int) $version->document_id === (int) $document->id, 404);

        DB::transaction(function () use ($document, $version): void {
            $document = Document::query()->lockForUpdate()->findOrFail($document->id);
            abort_unless((int) $version->document_id === (int) $document->id, 404);
            if (! in_array($document->status, ['draft', 'rejected', 'published'], true)) {
                throw ValidationException::withMessages([
                    'status' => $document->status === 'archived'
                        ? 'Restore this record from the archive before restoring a version.'
                        : 'A pending record cannot be withdrawn by restoring an older version.',
                ]);
            }

            $snapshot = $version->snapshot;
            $this->capture($document, auth()->id(), 'Automatic snapshot before restoring version '.$version->version_number);

            $attributes = $snapshot['document'] ?? [];
            $attributes['status'] = 'draft';
            $attributes['submitted_at'] = null;
            $attributes['published_at'] = null;
            $attributes['reviewed_by'] = null;
            $attributes['reviewed_at'] = null;
            $attributes['rejection_reason'] = null;
            $attributes['pre_archive_status'] = null;
            $attributes['archived_at'] = null;
            $attributes['file_path'] = $version->file_path;
            $attributes['original_filename'] = $version->original_filename;
            $attributes['mime_type'] = $version->mime_type;
            $attributes['file_size'] = $version->file_size;
            $document->update($attributes);

            if ($metadata = ($snapshot['metadata'] ?? null)) {
                $document->metadata()->updateOrCreate([], collect($metadata)->except(['id', 'document_id', 'created_at', 'updated_at'])->all());
            }

            $document->publicFields()->delete();
            $document->publicFields()->createMany($snapshot['public_fields'] ?? []);

            $tagIds = SdgTag::query()->whereIn('number', $snapshot['sdg_tags'] ?? [])->pluck('id');
            $document->sdgTags()->sync($tagIds->mapWithKeys(fn ($id) => [$id => ['source' => 'restored']])->all());

            $document->performanceRows()->delete();
            $document->performanceRows()->createMany($snapshot['performance_rows'] ?? []);
            $document->financial()->delete();
            if ($financial = ($snapshot['financial'] ?? null)) {
                $document->financial()->create(collect($financial)->except(['id', 'document_id', 'created_at', 'updated_at'])->all());
            }
            $document->papClassifications()->delete();
            $document->papClassifications()->createMany($snapshot['pap_classifications'] ?? []);
            $document->highlights()->delete();
            $document->highlights()->createMany($snapshot['highlights'] ?? []);
            $version->update(['restored_at' => now()]);
            $document->load(['metadata', 'sdgTags', 'publicFields']);
            $document->update(['completion_score' => $this->readiness->completionScore($document)]);
        });
    }
}
