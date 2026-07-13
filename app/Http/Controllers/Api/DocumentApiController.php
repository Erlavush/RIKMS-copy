<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreRikmsDocumentRequest;
use App\Http\Requests\UpdateRikmsDocumentRequest;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Services\AccessRequestService;
use App\Services\AuditLogService;
use App\Services\DocumentDownloadService;
use App\Services\DocumentPersistenceService;
use App\Services\DocumentVersionService;
use App\Services\DocumentWorkflowService;
use App\Services\RikmsPresenter;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DocumentApiController extends RikmsApiController
{
    public function __construct(
        private readonly DocumentPersistenceService $persistence,
        private readonly DocumentWorkflowService $workflow,
        private readonly DocumentVersionService $versions,
        private readonly DocumentDownloadService $downloads,
        private readonly RikmsPresenter $presenter,
        private readonly AuditLogService $audit,
        private readonly AccessRequestService $accessRequests,
    ) {}

    public function store(StoreRikmsDocumentRequest $request)
    {
        $document = $this->persistence->create($request->validated(), $request, $request->user());
        $this->audit->log($document->status === 'pending' ? 'document submitted' : 'document draft created', $document, [], $request);

        return response()->json([
            'message' => $document->status === 'pending' ? 'Document submitted for review.' : 'Draft saved.',
            'documentId' => $document->id, 'status' => $document->status,
            'redirect' => '/agency/research', 'data' => $this->presenter->document($document, true),
        ], 201);
    }

    public function show(Request $request, Document $document)
    {
        $this->authorize('view', $document);
        $document->load($this->relations());

        return response()->json(['data' => $this->presenter->document($document, true)]);
    }

    public function update(UpdateRikmsDocumentRequest $request, Document $document)
    {
        if ($document->status === 'pending') {
            throw ValidationException::withMessages(['status' => 'A pending record cannot be edited until review is complete.']);
        }
        if ($document->status === 'archived') {
            throw ValidationException::withMessages(['status' => 'Restore this record before editing it.']);
        }

        $oldAccessMode = $document->access_mode;
        $oldStatus = $document->status;
        $oldFilePath = $document->file_path;
        $oldExternalUrl = $document->external_url;
        $document = $this->persistence->update($document, $request->validated(), $request, $request->user());
        $accessInvalidated = $oldStatus === 'published' || $oldAccessMode !== $document->access_mode
            || $oldFilePath !== $document->file_path || $oldExternalUrl !== $document->external_url;
        if ($accessInvalidated) {
            $document->downloadGrants()->whereNull('revoked_at')->update(['revoked_at' => now()]);
            $this->accessRequests->cancelPending($document, $request->user(), 'The document changed or re-entered review; please submit a new request after republication.');
        }
        $this->audit->log('document updated', $document, ['review_required' => $document->status === 'draft'], $request);

        return response()->json(['message' => 'Document updated.', 'data' => $this->presenter->document($document, true)]);
    }

    public function submit(Request $request, Document $document)
    {
        $this->authorize('update', $document);
        abort_unless($request->user()->hasPermission('documents.submit'), 403);
        $document = $this->workflow->submit($document, $request->user());
        $this->audit->log('document submitted', $document, [], $request);

        return response()->json(['message' => 'Document submitted for review.', 'data' => $this->presenter->document($document, true)]);
    }

    public function approve(Request $request, Document $document)
    {
        $document = $this->workflow->approve($document, $request->user());
        $this->audit->log('document approved and published', $document, [], $request);

        return response()->json(['message' => 'Document approved and published.', 'data' => $this->presenter->document($document, true)]);
    }

    public function reject(Request $request, Document $document)
    {
        $validated = $request->validate(['reason' => ['required', 'string', 'min:10', 'max:5000']]);
        $document = $this->workflow->reject($document, $request->user(), $validated['reason']);
        $this->audit->log('document rejected', $document, ['reason' => $validated['reason']], $request);

        return response()->json(['message' => 'Document returned for revision.', 'data' => $this->presenter->document($document, true)]);
    }

    public function archive(Request $request, Document $document)
    {
        $this->authorize('delete', $document);
        abort_unless($request->user()->isSuperAdmin() || $request->user()->hasPermission('documents.archive'), 403);
        $document = $this->workflow->archive($document, $request->user());
        $document->downloadGrants()->whereNull('revoked_at')->update(['revoked_at' => now()]);
        $this->accessRequests->cancelPending($document, $request->user(), 'The document was archived and is no longer available.');
        $this->audit->log('document archived', $document, [], $request);

        return response()->json(['message' => 'Document moved to archive.', 'data' => $this->presenter->document($document, true)]);
    }

    public function restore(Request $request, Document $document)
    {
        $this->authorize('restore', $document);
        abort_unless($request->user()->isSuperAdmin() || $request->user()->hasPermission('documents.archive'), 403);
        $document = $this->workflow->restore($document, $request->user());
        $this->audit->log('document restored', $document, [], $request);

        return response()->json(['message' => 'Document restored.', 'data' => $this->presenter->document($document, true)]);
    }

    public function versions(Request $request, Document $document)
    {
        $this->authorize('view', $document);
        $paginator = $document->versions()->with('creator')->latest('version_number')->paginate($this->perPage());

        return $this->paginated($paginator, fn (DocumentVersion $version) => $this->presentVersion($version));
    }

    public function createVersion(Request $request, Document $document)
    {
        $this->authorize('update', $document);
        $validated = $request->validate(['changeSummary' => ['nullable', 'string', 'max:2000']]);
        $version = $this->versions->capture($document, $request->user()->id, $validated['changeSummary'] ?? 'Manual version snapshot');
        $this->audit->log('document version created', $document, ['version' => $version->version_number], $request);

        return response()->json(['message' => 'Version snapshot created.', 'data' => $this->presentVersion($version->load('creator'))], 201);
    }

    public function restoreVersion(Request $request, Document $document, DocumentVersion $version)
    {
        $this->authorize('update', $document);
        $this->versions->restore($document, $version);
        $document->downloadGrants()->whereNull('revoked_at')->update(['revoked_at' => now()]);
        $this->accessRequests->cancelPending($document, $request->user(), 'The document version changed and must complete review again.');
        $this->audit->log('document version restored', $document, ['version' => $version->version_number], $request);

        return response()->json([
            'message' => 'Version restored as a review-gated draft.',
            'data' => $this->presenter->document($document->fresh($this->relations()), true),
        ]);
    }

    public function download(Request $request, Document $document)
    {
        $this->authorize('view', $document);

        return $this->downloads->response($document, $request);
    }

    private function presentVersion(DocumentVersion $version): array
    {
        return [
            'id' => $version->id, 'versionNumber' => $version->version_number,
            'changeSummary' => $version->change_summary, 'createdBy' => $version->creator?->name,
            'createdAt' => $version->created_at->toISOString(),
            'restoredAt' => $version->restored_at?->toISOString(),
            'filename' => $version->original_filename, 'fileSize' => $version->file_size,
        ];
    }

    private function relations(): array
    {
        return ['metadata', 'publicFields', 'sdgTags', 'agency', 'uploader', 'performanceRows', 'financial', 'papClassifications', 'highlights'];
    }
}
