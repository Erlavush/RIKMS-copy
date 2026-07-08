<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAccessRequestRequest;
use App\Models\AccessRequest;
use App\Models\Document;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function download(Document $document)
    {
    $this->authorize('view', $document);
    abort_if(! $document->file_path || ! Storage::exists($document->file_path), 404);
    $this->audit->log('file downloaded', $document, [], request());
    
    return Storage::download($document->file_path, $document->original_filename);
    }
    
    public function __construct(private readonly AuditLogService $audit)
    {
    }

    public function show(Document $document)
    {
        $this->authorize('view', $document);
        $document->load(['metadata', 'sdgTags', 'agency', 'publicFields']);

        return view('documents.show', ['document' => $document]);
    }

    public function update(Request $request, Document $document)
    {
        $this->authorize('update', $document);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', 'in:draft,pending,published,archived,rejected'],
            'category' => ['nullable', 'string', 'max:255'],
            'access_mode' => ['nullable', 'in:public_download,request_access,restricted_admin,embargo_until_date,external_link_only'],
        ]);

        $document->update($validated);
        $this->audit->log('document updated', $document, $validated, $request);

        return back()->with('status', 'Document updated.');
    }

    public function destroy(Request $request, Document $document)
    {
        $this->authorize('delete', $document);
        $document->update(['status' => 'archived']);
        $this->audit->log('archived/deleted', $document, [], $request);

        return back()->with('status', 'Document moved to archive.');
    }

    public function requestAccess(StoreAccessRequestRequest $request, Document $document)
    {
        $validated = $request->validated();
        $user = Auth::user();

        AccessRequest::create([
            'document_id' => $document->id,
            'requester_id' => $user?->id,
            'requester_name' => $validated['requester_name'] ?? $user?->name,
            'requester_email' => $validated['requester_email'] ?? $user?->email,
            'message' => $validated['message'] ?? 'Requesting access to this repository document.',
            'status' => 'pending',
        ]);

        $this->audit->log('access requested', $document, [], $request);

        return back()->with('status', 'Access request submitted.');
    }
}
