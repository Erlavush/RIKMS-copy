<?php

namespace App\Http\Controllers\Api;

use App\Models\AccessRequest;
use App\Services\AccessRequestService;
use App\Services\AuditLogService;
use App\Services\RikmsPresenter;
use Illuminate\Http\Request;

class AccessRequestApiController extends RikmsApiController
{
    public function __construct(
        private readonly AccessRequestService $service,
        private readonly RikmsPresenter $presenter,
        private readonly AuditLogService $audit,
    ) {}

    public function approve(Request $request, AccessRequest $accessRequest)
    {
        $this->authorizeDecision($request, $accessRequest);
        $validated = $request->validate(['reason' => ['nullable', 'string', 'max:2000']]);
        $result = $this->service->approve($accessRequest, $request->user(), $validated['reason'] ?? null);
        $this->audit->log('access request approved', $accessRequest->document, ['access_request_id' => $accessRequest->id], $request);

        return response()->json([
            'message' => 'Access request approved. A private download link was sent to the requester.',
            'data' => $this->presenter->accessRequest($result['request']),
            'downloadUrl' => $result['downloadUrl'],
        ]);
    }

    public function reject(Request $request, AccessRequest $accessRequest)
    {
        $this->authorizeDecision($request, $accessRequest);
        $validated = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:2000']]);
        $accessRequest = $this->service->reject($accessRequest, $request->user(), $validated['reason']);
        $this->audit->log('access request rejected', $accessRequest->document, ['access_request_id' => $accessRequest->id, 'reason' => $validated['reason']], $request);

        return response()->json(['message' => 'Access request rejected.', 'data' => $this->presenter->accessRequest($accessRequest)]);
    }

    private function authorizeDecision(Request $request, AccessRequest $accessRequest): void
    {
        $accessRequest->loadMissing('document');
        $this->authorize('update', $accessRequest->document);
        abort_unless($request->user()->isSuperAdmin() || $request->user()->hasPermission('access_requests.manage'), 403);
    }
}
