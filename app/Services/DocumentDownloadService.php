<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DownloadEvent;
use App\Models\DownloadGrant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class DocumentDownloadService
{
    public function __construct(private readonly DocumentAccessService $access) {}

    public function response(Document $document, Request $request): Response
    {
        $user = $request->user();
        $owner = $this->access->isAdministrativeOwner($user, $document);
        $grant = null;

        if (! $owner) {
            abort_unless($document->status === 'published', 404);
            if ($request->filled('grant')) {
                abort_unless($request->hasValidSignature(), 403, 'This download link is invalid or expired.');
                $grant = DownloadGrant::query()
                    ->where('document_id', $document->id)
                    ->where('token_hash', hash('sha256', (string) $request->query('grant')))
                    ->first();
                abort_unless($grant?->isUsable(), 403, 'This download grant is invalid, expired, revoked, or exhausted.');
            } else {
                $this->authorizePublicMode($document);
            }
        }

        if ($document->access_mode === 'external_link_only' && $document->external_url) {
            $this->recordDownload($document, $grant, $request, $user);

            return redirect()->away($document->external_url);
        }

        abort_unless($document->file_path && Storage::disk('local')->exists($document->file_path), 404, 'The document file is not available.');

        $this->recordDownload($document, $grant, $request, $user);

        return Storage::disk('local')->download(
            $document->file_path,
            $document->original_filename ?: 'rikms-document-'.$document->id.'.pdf',
            ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']
        );
    }

    private function recordDownload(Document $document, ?DownloadGrant $grant, Request $request, ?User $user): void
    {
        DB::transaction(function () use ($document, $grant, $request, $user): void {
            Document::query()->whereKey($document->id)->increment('download_count');
            if ($grant) {
                $lockedGrant = DownloadGrant::query()->whereKey($grant->id)->lockForUpdate()->first();
                abort_unless($lockedGrant?->isUsable(), 403, 'This download grant is invalid, expired, revoked, or exhausted.');
                $lockedGrant->increment('download_count');
            }
            DownloadEvent::create([
                'document_id' => $document->id,
                'user_id' => $user?->id,
                'download_grant_id' => $grant?->id,
                'email' => $grant !== null ? $grant->email : $user?->email,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });
    }

    private function authorizePublicMode(Document $document): void
    {
        match ($document->access_mode) {
            'public_download' => null,
            'external_link_only' => null,
            'embargo_until_date' => abort_unless($document->embargo_until?->isPast(), 403, 'This document is still under embargo.'),
            'request_access' => abort(403, 'An approved access request is required.'),
            default => abort(403, 'This document is restricted to administrators.'),
        };
    }
}
