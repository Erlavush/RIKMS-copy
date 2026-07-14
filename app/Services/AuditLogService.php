<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditLogService
{
    public function log(string $action, ?Document $document = null, array $details = [], ?Request $request = null): void
    {
        $agencyId = $details['_agency_id'] ?? null;
        if ($agencyId === null && $document !== null) {
            $agencyId = $document->agency_id;
        }
        if ($agencyId === null) {
            $agencyId = Auth::user()?->agency_id;
        }
        AuditLog::create([
            'user_id' => Auth::id(),
            'document_id' => $document?->id,
            'agency_id' => $agencyId,
            'action' => $action,
            'event_type' => $details['_event_type'] ?? 'activity',
            'severity' => $details['_severity'] ?? 'info',
            'details' => $details ? collect($details)->except(['_event_type', '_severity', '_agency_id'])->all() : null,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }
}
