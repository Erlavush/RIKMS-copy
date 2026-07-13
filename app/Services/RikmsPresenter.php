<?php

namespace App\Services;

use App\Models\AccessRequest;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Storage;

class RikmsPresenter
{
    public function __construct(private readonly DocumentAccessService $access) {}

    public function document(Document $document, bool $private = false): array
    {
        $document->loadMissing(['metadata', 'sdgTags', 'agency', 'uploader', 'publicFields']);
        $public = $document->publicFields->where('is_public', true)->pluck('field_name')->all();
        $metadata = $document->metadata;
        $field = fn (string $name, mixed $value, mixed $fallback = null) => $private || in_array($name, $public, true) ? ($value ?? $fallback) : $fallback;
        $access = $this->accessCapabilities($document);

        $item = [
            'id' => $document->id,
            'title' => $field('title', $metadata?->title ?: $document->title, 'Restricted research record'),
            'authors' => $field('authors', $metadata?->authors, []),
            'agency' => $document->agency->name,
            'agencyId' => $document->agency_id,
            'agencyAbbr' => $document->agency->abbreviation(),
            'year' => $document->year,
            'quarter' => $document->reporting_quarter,
            'abstract' => $field('abstract', $metadata?->abstract, ''),
            'keywords' => $field('keywords', $metadata?->keywords, []),
            'sdgs' => $document->sdgTags->pluck('number')->values()->all(),
            'category' => $document->category ?: $document->documentTypeLabel(),
            'documentType' => $document->document_type,
            'doi' => $field('doi', $metadata?->doi),
            'fileType' => $this->fileExists($document) ? strtoupper(pathinfo($document->original_filename ?: 'document.pdf', PATHINFO_EXTENSION) ?: 'PDF') : null,
            'fileSize' => $document->file_size,
            'downloads' => $document->download_count,
            'status' => $document->status,
            'accessMode' => $document->access_mode,
            'completionScore' => $document->completion_score,
            'digitalLibraryScore' => $document->digital_library_score,
            'isAiTagged' => $document->is_ai_tagged,
            'publishedAt' => $document->published_at?->toISOString(),
            'submittedAt' => $document->submitted_at?->toISOString(),
            'createdAt' => $document->created_at->toISOString(),
            'updatedAt' => $document->updated_at->toISOString(),
            'canDownload' => $access['download'],
            'canRequestAccess' => $access['request'],
            'externalUrl' => $document->access_mode === 'external_link_only' ? $document->external_url : null,
        ];

        if ($private) {
            $item += [
                'description' => $document->description,
                'originalFilename' => $document->original_filename,
                'embargoUntil' => $document->embargo_until?->toDateString(),
                'ownerName' => $document->owner_name,
                'ownerEmail' => $document->owner_email,
                'notifyAccessRequests' => $document->notify_access_requests,
                'notifyResearchInquiries' => $document->notify_research_inquiries,
                'sendCopyToAgencyAdmin' => $document->send_copy_to_agency_admin,
                'rejectionReason' => $document->rejection_reason,
                'reviewedAt' => $document->reviewed_at?->toISOString(),
                'archivedAt' => $document->archived_at?->toISOString(),
                'metadata' => [
                    'title' => $metadata?->title,
                    'abstract' => $metadata?->abstract,
                    'methodology' => $metadata?->methodology,
                    'reviewOfRelatedLiterature' => $metadata?->review_of_related_literature,
                    'theoreticalFramework' => $metadata?->theoretical_framework,
                    'resultsAndDiscussion' => $metadata?->results_and_discussion,
                    'keywords' => $metadata ? ($metadata->keywords ?? []) : [],
                    'authors' => $metadata ? ($metadata->authors ?? []) : [],
                    'doi' => $metadata?->doi,
                    'aiConfidence' => $metadata?->ai_confidence,
                ],
                'publicFields' => $public,
            ];

            if ($document->relationLoaded('performanceRows')) {
                $item['performanceRows'] = $document->performanceRows->map(fn ($row) => [
                    'id' => $row->id,
                    'target' => $row->activity_output_indicator,
                    'targetValue' => (float) $row->target,
                    'actual' => (float) $row->actual,
                    'accomplishmentPercentage' => (float) $row->accomplishment_percentage,
                    'status' => $row->status,
                ])->values();
            }

            if ($document->relationLoaded('financial')) {
                $item['financial'] = $document->financial ? [
                    'allocated' => (float) $document->financial->allotted_budget,
                    'released' => (float) $document->financial->released_amount,
                    'obligated' => (float) $document->financial->obligated_amount,
                    'used' => (float) $document->financial->utilized_amount,
                    'remaining' => (float) $document->financial->remaining_balance,
                    'utilizationPercentage' => (float) $document->financial->budget_utilization_percentage,
                    'asOfDate' => $document->financial->financial_as_of_date?->toDateString(),
                ] : null;
            }

            if ($document->relationLoaded('papClassifications')) {
                $item['papClassifications'] = $document->papClassifications->map(fn ($pap) => [
                    'id' => $pap->id, 'category' => $pap->category, 'description' => $pap->description,
                    'sectors' => collect([
                        'Government' => $pap->beneficiary_government, 'Academe' => $pap->beneficiary_academe,
                        'Business' => $pap->beneficiary_business, 'Civil Society' => $pap->beneficiary_civil_society,
                        'Media' => $pap->beneficiary_media,
                    ])->filter()->keys()->all(),
                ])->values();
            }

            if ($document->relationLoaded('highlights')) {
                $item['highlights'] = $document->highlights->map(fn ($highlight) => [
                    'id' => $highlight->id, 'title' => $highlight->title,
                    'description' => $highlight->description, 'isFeatured' => $highlight->is_featured,
                ])->values();
            }
        } else {
            $item['metadata'] = [
                'methodology' => $field('methodology', $metadata?->methodology),
                'reviewOfRelatedLiterature' => $field('review_of_related_literature', $metadata?->review_of_related_literature),
                'theoreticalFramework' => $field('theoretical_framework', $metadata?->theoretical_framework),
                'resultsAndDiscussion' => $field('results_and_discussion', $metadata?->results_and_discussion),
                'doi' => $field('doi', $metadata?->doi),
            ];
        }

        return $item;
    }

    public function accessRequest(AccessRequest $request): array
    {
        $request->loadMissing(['document.metadata', 'requester', 'decisionMaker']);

        return [
            'id' => $request->id,
            'documentId' => $request->document_id,
            'title' => $request->document->metadata?->title ?: $request->document->title,
            'agencyId' => $request->document->agency_id,
            'requesterName' => $request->requester_name,
            'requesterEmail' => $request->requester_email,
            'requesterOrganization' => $request->requester_organization,
            'message' => $request->message,
            'status' => $request->status,
            'decisionReason' => $request->decision_reason,
            'decidedBy' => $request->decisionMaker?->name,
            'decidedAt' => $request->decided_at?->toISOString(),
            'createdAt' => $request->created_at->toISOString(),
        ];
    }

    public function audit(AuditLog $log): array
    {
        $log->loadMissing(['document.metadata', 'user', 'agency']);

        return [
            'id' => $log->id, 'action' => $log->action, 'eventType' => $log->event_type,
            'severity' => $log->severity, 'user' => $log->user?->name,
            'userId' => $log->user_id, 'agency' => $log->agency?->name,
            'agencyId' => $log->agency_id,
            'documentTitle' => $log->document?->metadata?->title ?: $log->document?->title,
            'documentId' => $log->document_id, 'createdAt' => $log->created_at->toISOString(),
            'details' => $log->details ?? [], 'ipAddress' => $log->ip_address,
        ];
    }

    public function notification(UserNotification $notification): array
    {
        return [
            'id' => $notification->id, 'type' => $notification->type,
            'title' => $notification->title, 'message' => $notification->message,
            'data' => $notification->data ?? [], 'read' => $notification->read_at !== null,
            'readAt' => $notification->read_at?->toISOString(),
            'createdAt' => $notification->created_at->toISOString(),
        ];
    }

    private function accessCapabilities(Document $document): array
    {
        $user = auth()->user();
        $owner = $this->access->isAdministrativeOwner($user, $document);

        if ($owner) {
            return ['download' => $this->fileExists($document) || (bool) $document->external_url, 'request' => false];
        }

        return match ($document->access_mode) {
            'public_download' => ['download' => $this->fileExists($document), 'request' => false],
            'external_link_only' => ['download' => (bool) $document->external_url, 'request' => false],
            'embargo_until_date' => [
                'download' => $document->embargo_until?->isPast() && $this->fileExists($document),
                'request' => ($document->embargo_until?->isFuture() ?? false) && $this->fileExists($document),
            ],
            'request_access' => ['download' => false, 'request' => $this->fileExists($document)],
            default => ['download' => false, 'request' => false],
        };
    }

    private function fileExists(Document $document): bool
    {
        return (bool) $document->file_path && Storage::disk('local')->exists($document->file_path);
    }
}
