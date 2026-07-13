<?php

namespace App\Services;

use App\Models\Document;
use App\Models\User;
use App\Notifications\DocumentReviewMailNotification;
use App\Notifications\DocumentSubmittedMailNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class DocumentWorkflowService
{
    public function __construct(
        private readonly DocumentVersionService $versions,
        private readonly UserNotificationService $notifications,
        private readonly DocumentReadinessService $readiness,
    ) {}

    public function submit(Document $document, User $actor): Document
    {
        if (! in_array($document->status, ['draft', 'rejected'], true)) {
            throw ValidationException::withMessages(['status' => 'Only drafts or rejected records can be submitted.']);
        }

        $this->ensureReady($document);

        $document->loadMissing(['metadata', 'publicFields', 'sdgTags', 'performanceRows', 'papClassifications', 'financial']);
        $errors = [];
        if (! trim((string) ($document->metadata?->title ?: $document->title))) {
            $errors['metadata.title'] = 'A title is required before submission.';
        }
        if (! $document->file_path && $document->access_mode !== 'external_link_only') {
            $errors['document_file'] = 'A document file is required before submission.';
        }
        if ($document->access_mode === 'external_link_only' && ! $document->external_url) {
            $errors['external_url'] = 'An external URL is required for external-link records.';
        }
        if ($document->access_mode === 'embargo_until_date' && (! $document->embargo_until || ! $document->embargo_until->isFuture())) {
            $errors['embargo_until'] = 'A future embargo date is required.';
        }
        if ($document->sdgTags->isEmpty()) {
            $errors['sdg_tags'] = 'Select at least one Sustainable Development Goal before submission.';
        }
        if ($document->usesReportFlow()) {
            if (! $document->year || ! $document->reporting_quarter) {
                $errors['quarter'] = 'A reporting year and quarter are required for reports.';
            }
            if ($document->performanceRows->isEmpty()) {
                $errors['projects'] = 'At least one performance target is required for reports.';
            }
            if ($document->papClassifications->isEmpty()) {
                $errors['pap.categories'] = 'At least one PAP classification is required for reports.';
            }
            if (! $document->financial || (float) $document->financial->allotted_budget <= 0) {
                $errors['financials.allocated'] = 'A meaningful allotted budget is required for reports.';
            }
        }
        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        return DB::transaction(function () use ($document, $actor): Document {
            $document = Document::query()->lockForUpdate()->findOrFail($document->id);
            if (! in_array($document->status, ['draft', 'rejected'], true)) {
                throw ValidationException::withMessages(['status' => 'Only drafts or rejected records can be submitted.']);
            }
            $this->ensureReady($document);
            $this->versions->capture($document, $actor->id, 'Submitted for review');
            $document->update([
                'status' => 'pending', 'submitted_at' => now(), 'published_at' => null,
                'reviewed_by' => null, 'reviewed_at' => null, 'rejection_reason' => null,
            ]);
            $document->loadMissing(['metadata', 'sdgTags', 'publicFields']);
            $document->update(['completion_score' => $this->readiness->completionScore($document)]);
            $this->notifications->sendToSuperAdmins(
                'document_submitted', 'Document awaiting review',
                ($document->metadata?->title ?: $document->title).' was submitted for review.',
                ['documentId' => $document->id]
            );
            User::query()->where('role', 'super_admin')->where('is_active', true)->get()
                ->each(fn (User $reviewer) => $reviewer->notify(new DocumentSubmittedMailNotification($document)));

            return $document->fresh();
        });
    }

    public function approve(Document $document, User $actor): Document
    {
        abort_unless($actor->isSuperAdmin(), 403);
        if ($document->status !== 'pending') {
            throw ValidationException::withMessages(['status' => 'Only pending records can be approved.']);
        }
        $this->ensureReady($document);

        return DB::transaction(function () use ($document, $actor): Document {
            $document = Document::query()->lockForUpdate()->findOrFail($document->id);
            if ($document->status !== 'pending') {
                throw ValidationException::withMessages(['status' => 'Only pending records can be approved.']);
            }
            $this->ensureReady($document);
            $this->versions->capture($document, $actor->id, 'Approved and published');
            $document->update([
                'status' => 'published', 'published_at' => now(), 'reviewed_by' => $actor->id,
                'reviewed_at' => now(), 'rejection_reason' => null,
            ]);
            $uploader = $document->uploader;
            $uploaderSettings = $uploader->agency_id ? ($uploader->agency->settings ?? []) : [];
            $reviewNotifications = (bool) ($uploaderSettings['notify_review_decisions'] ?? true);
            if ($reviewNotifications) {
                $this->notifications->send(
                    $document->uploader, 'document_approved', 'Document approved',
                    ($document->metadata?->title ?: $document->title).' is now published.',
                    ['documentId' => $document->id]
                );
                $document->uploader->notify(new DocumentReviewMailNotification($document, 'approved'));
            }

            return $document->fresh();
        });
    }

    public function reject(Document $document, User $actor, string $reason): Document
    {
        abort_unless($actor->isSuperAdmin(), 403);
        if ($document->status !== 'pending') {
            throw ValidationException::withMessages(['status' => 'Only pending records can be rejected.']);
        }

        return DB::transaction(function () use ($document, $actor, $reason): Document {
            $document = Document::query()->lockForUpdate()->findOrFail($document->id);
            if ($document->status !== 'pending') {
                throw ValidationException::withMessages(['status' => 'Only pending records can be rejected.']);
            }
            $this->versions->capture($document, $actor->id, 'Rejected during review');
            $document->update([
                'status' => 'rejected', 'published_at' => null, 'reviewed_by' => $actor->id,
                'reviewed_at' => now(), 'rejection_reason' => $reason,
            ]);
            $uploader = $document->uploader;
            $uploaderSettings = $uploader->agency_id ? ($uploader->agency->settings ?? []) : [];
            $reviewNotifications = (bool) ($uploaderSettings['notify_review_decisions'] ?? true);
            if ($reviewNotifications) {
                $this->notifications->send(
                    $document->uploader, 'document_rejected', 'Document needs revision',
                    $reason, ['documentId' => $document->id]
                );
                $document->uploader->notify(new DocumentReviewMailNotification($document, 'rejected', $reason));
            }

            return $document->fresh();
        });
    }

    public function archive(Document $document, User $actor): Document
    {
        if ($document->status === 'archived') {
            return $document;
        }

        return DB::transaction(function () use ($document, $actor): Document {
            $document = Document::query()->lockForUpdate()->findOrFail($document->id);
            if ($document->status === 'archived') {
                return $document;
            }
            $this->versions->capture($document, $actor->id, 'Archived');
            $document->update([
                'pre_archive_status' => $document->status, 'status' => 'archived', 'archived_at' => now(),
            ]);

            return $document->fresh();
        });
    }

    public function restore(Document $document, User $actor): Document
    {
        if ($document->status !== 'archived') {
            throw ValidationException::withMessages(['status' => 'Only archived records can be restored.']);
        }

        return DB::transaction(function () use ($document, $actor): Document {
            $document = Document::query()->lockForUpdate()->findOrFail($document->id);
            if ($document->status !== 'archived') {
                throw ValidationException::withMessages(['status' => 'Only archived records can be restored.']);
            }
            $this->versions->capture($document, $actor->id, 'Restored from archive');
            $status = in_array($document->pre_archive_status, ['draft', 'pending', 'published', 'rejected'], true)
                ? $document->pre_archive_status : 'draft';
            $document->update(['status' => $status, 'archived_at' => null, 'pre_archive_status' => null]);

            return $document->fresh();
        });
    }

    private function ensureReady(Document $document): void
    {
        $document->loadMissing(['metadata', 'publicFields', 'sdgTags', 'performanceRows', 'papClassifications', 'financial']);
        $errors = [];
        if (! trim((string) ($document->metadata?->title ?: $document->title))) {
            $errors['metadata.title'] = 'A title is required before review.';
        }
        if ($document->access_mode === 'external_link_only') {
            if (! $document->external_url || ! filter_var($document->external_url, FILTER_VALIDATE_URL)) {
                $errors['external_url'] = 'A valid external URL is required.';
            }
        } elseif (! $document->file_path || ! Storage::disk('local')->exists($document->file_path)) {
            $errors['document_file'] = 'An available document file is required.';
        }
        if ($document->access_mode === 'embargo_until_date' && (! $document->embargo_until || ! $document->embargo_until->isFuture())) {
            $errors['embargo_until'] = 'A future embargo date is required.';
        }
        if ($document->sdgTags->isEmpty()) {
            $errors['sdg_tags'] = 'Select at least one Sustainable Development Goal.';
        }
        if ($document->usesReportFlow()) {
            if (! $document->year || ! $document->reporting_quarter) {
                $errors['quarter'] = 'A reporting year and quarter are required for reports.';
            }
            if ($document->performanceRows->isEmpty()) {
                $errors['projects'] = 'At least one performance target is required for reports.';
            }
            if ($document->papClassifications->isEmpty()) {
                $errors['pap.categories'] = 'At least one PAP classification is required for reports.';
            }
            if (! $document->financial || (float) $document->financial->allotted_budget <= 0) {
                $errors['financials.allocated'] = 'A meaningful allotted budget is required for reports.';
            }
        }
        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
    }
}
