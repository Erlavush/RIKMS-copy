<?php

namespace App\Services;

use App\Models\AccessRequest;
use App\Models\Document;
use App\Models\DownloadGrant;
use App\Models\User;
use App\Notifications\AccessDecisionMailNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AccessRequestService
{
    public function __construct(
        private readonly UserNotificationService $notifications,
        private readonly PlatformSettingsService $settings,
    ) {}

    public function create(Document $document, array $data, Request $request): AccessRequest
    {
        abort_unless($document->status === 'published', 404);
        abort_unless(in_array($document->access_mode, ['request_access', 'embargo_until_date'], true), 422, 'This document does not accept access requests.');
        abort_unless($document->file_path && Storage::disk('local')->exists($document->file_path), 422, 'The document file is not available for access requests.');
        if ($document->access_mode === 'embargo_until_date') {
            abort_unless($document->embargo_until?->isFuture(), 422, 'This embargo has expired; use the public download instead.');
        }

        $user = $request->user();
        $email = strtolower((string) ($user ? $user->email : ($data['requester_email'] ?? '')));
        $name = trim((string) ($user ? $user->name : ($data['requester_name'] ?? '')));

        if ($email === '' || $name === '') {
            throw ValidationException::withMessages([
                'requester_email' => 'Your name and email address are required.',
            ]);
        }

        $duplicate = $document->accessRequests()
            ->whereRaw('LOWER(requester_email) = ?', [$email])
            ->where('status', 'pending')
            ->exists();
        $usableGrant = $document->accessRequests()
            ->whereRaw('LOWER(requester_email) = ?', [$email])
            ->where('status', 'approved')
            ->whereHas('grant', fn ($query) => $query->whereNull('revoked_at')
                ->where('expires_at', '>', now())->whereColumn('download_count', '<', 'max_downloads'))
            ->exists();
        if ($duplicate || $usableGrant) {
            throw ValidationException::withMessages([
                'requester_email' => $duplicate
                    ? 'A pending request already exists for this email address.'
                    : 'An active download grant already exists for this email address.',
            ]);
        }

        return DB::transaction(function () use ($document, $data, $user, $email, $name): AccessRequest {
            $document = Document::query()->lockForUpdate()->findOrFail($document->id);
            abort_unless($document->status === 'published', 404);
            abort_unless(in_array($document->access_mode, ['request_access', 'embargo_until_date'], true), 422, 'This document does not accept access requests.');
            abort_unless($document->file_path && Storage::disk('local')->exists($document->file_path), 422, 'The document file is not available for access requests.');
            if ($document->access_mode === 'embargo_until_date') {
                abort_unless($document->embargo_until?->isFuture(), 422, 'This embargo has expired; use the public download instead.');
            }
            $duplicate = $document->accessRequests()->whereRaw('LOWER(requester_email) = ?', [$email])
                ->where('status', 'pending')->exists();
            $usableGrant = $document->accessRequests()->whereRaw('LOWER(requester_email) = ?', [$email])
                ->where('status', 'approved')->whereHas('grant', fn ($query) => $query->whereNull('revoked_at')
                ->where('expires_at', '>', now())->whereColumn('download_count', '<', 'max_downloads'))->exists();
            if ($duplicate || $usableGrant) {
                throw ValidationException::withMessages([
                    'requester_email' => $duplicate
                        ? 'A pending request already exists for this email address.'
                        : 'An active download grant already exists for this email address.',
                ]);
            }

            $accessRequest = AccessRequest::create([
                'document_id' => $document->id,
                'requester_id' => $user?->id,
                'requester_name' => $name,
                'requester_email' => $email,
                'requester_organization' => $data['requester_organization'] ?? null,
                'message' => $data['message'] ?? 'Requesting access to this repository document.',
                'status' => 'pending',
            ]);

            if ($document->notify_access_requests) {
                $this->notifications->sendToAgency(
                    $document->agency_id, 'access_requested', 'New document access request',
                    $name.' requested access to '.($document->metadata?->title ?: $document->title).'.',
                    ['documentId' => $document->id, 'accessRequestId' => $accessRequest->id]
                );
            }

            return $accessRequest;
        });
    }

    public function approve(AccessRequest $accessRequest, User $actor, ?string $reason = null): array
    {
        if ($accessRequest->status !== 'pending') {
            throw ValidationException::withMessages(['status' => 'Only pending access requests can be approved.']);
        }

        $rawToken = Str::random(64);
        $expires = now()->addDays((int) $this->settings->get('access_grant_days'));

        [$decidedRequest, $grant, $url] = DB::transaction(function () use ($accessRequest, $actor, $reason, $rawToken, $expires): array {
            $decidedRequest = AccessRequest::query()->lockForUpdate()->findOrFail($accessRequest->id);
            if ($decidedRequest->status !== 'pending') {
                throw ValidationException::withMessages(['status' => 'Only pending access requests can be approved.']);
            }
            $document = Document::query()->lockForUpdate()->findOrFail($decidedRequest->document_id);
            $eligibleMode = $document->access_mode === 'request_access'
                || ($document->access_mode === 'embargo_until_date' && $document->embargo_until?->isFuture());
            if ($document->status !== 'published' || ! $eligibleMode
                || ! $document->file_path || ! Storage::disk('local')->exists($document->file_path)) {
                throw ValidationException::withMessages(['document' => 'This document is no longer eligible for access approval.']);
            }

            $decidedRequest->update([
                'status' => 'approved', 'decision_reason' => $reason,
                'approved_by' => $actor->id, 'decided_by' => $actor->id,
                'approved_at' => now(), 'rejected_at' => null, 'decided_at' => now(),
            ]);
            $decidedRequest->grants()->whereNull('revoked_at')->update(['revoked_at' => now()]);
            $grant = DownloadGrant::create([
                'document_id' => $decidedRequest->document_id,
                'access_request_id' => $decidedRequest->id,
                'user_id' => $decidedRequest->requester_id,
                'email' => strtolower((string) $decidedRequest->requester_email),
                'token_hash' => hash('sha256', $rawToken),
                'expires_at' => $expires,
                'max_downloads' => 5,
                'created_by' => $actor->id,
            ]);
            $url = URL::temporarySignedRoute(
                'api.rikms.public.documents.download', $expires,
                ['document' => $decidedRequest->document_id, 'grant' => $rawToken]
            );

            return [$decidedRequest, $grant, $url];
        });

        $fresh = $decidedRequest->fresh(['document.metadata', 'requester']);
        $this->notifyDecision($fresh, 'approved', $url, $reason);

        return ['request' => $fresh, 'grant' => $grant, 'downloadUrl' => $url];
    }

    public function reject(AccessRequest $accessRequest, User $actor, string $reason): AccessRequest
    {
        if ($accessRequest->status !== 'pending') {
            throw ValidationException::withMessages(['status' => 'Only pending access requests can be rejected.']);
        }

        $decidedRequest = DB::transaction(function () use ($accessRequest, $actor, $reason): AccessRequest {
            $decidedRequest = AccessRequest::query()->lockForUpdate()->findOrFail($accessRequest->id);
            if ($decidedRequest->status !== 'pending') {
                throw ValidationException::withMessages(['status' => 'Only pending access requests can be rejected.']);
            }
            Document::query()->lockForUpdate()->findOrFail($decidedRequest->document_id);
            $decidedRequest->update([
                'status' => 'rejected', 'decision_reason' => $reason,
                'approved_by' => null, 'decided_by' => $actor->id, 'approved_at' => null,
                'rejected_at' => now(), 'decided_at' => now(),
            ]);
            $decidedRequest->grants()->whereNull('revoked_at')->update(['revoked_at' => now()]);

            return $decidedRequest;
        });

        $fresh = $decidedRequest->fresh(['document.metadata', 'requester']);
        $this->notifyDecision($fresh, 'rejected', null, $reason);

        return $fresh;
    }

    public function cancelPending(Document $document, User $actor, string $reason): void
    {
        $ids = $document->accessRequests()->where('status', 'pending')->pluck('id');
        foreach ($ids as $id) {
            $pending = AccessRequest::query()->find($id);
            if ($pending?->status === 'pending') {
                $this->reject($pending, $actor, $reason);
            }
        }
    }

    private function notifyDecision(AccessRequest $accessRequest, string $decision, ?string $url, ?string $reason): void
    {
        $title = $accessRequest->document->metadata?->title ?: $accessRequest->document->title;
        if ($accessRequest->requester) {
            $this->notifications->send(
                $accessRequest->requester, 'access_'.$decision,
                'Document access request '.($decision === 'approved' ? 'approved' : 'declined'),
                $decision === 'approved' ? "Access to {$title} was approved." : ($reason ?: "Access to {$title} was declined."),
                ['documentId' => $accessRequest->document_id, 'accessRequestId' => $accessRequest->id]
            );
        }

        Notification::route('mail', $accessRequest->requester_email)
            ->notify(new AccessDecisionMailNotification($accessRequest, $decision, $url, $reason));
    }
}
