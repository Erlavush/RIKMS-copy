<?php

namespace App\Http\Controllers\Api;

use App\Models\Document;
use App\Models\DocumentAiAnalysis;
use App\Services\AuditLogService;
use App\Services\DocumentAiAnalysisService;
use Illuminate\Http\Request;

class DocumentAiAnalysisController extends RikmsApiController
{
    private const REVIEWABLE_FIELDS = [
        'title', 'abstract', 'methodology', 'review_of_related_literature',
        'theoretical_framework', 'results_and_discussion', 'keywords', 'authors',
        'doi', 'category', 'suggested_sdgs',
    ];

    public function __construct(
        private readonly DocumentAiAnalysisService $analyses,
        private readonly AuditLogService $audit,
    ) {}

    public function show(Request $request, Document $document)
    {
        $this->authorize('view', $document);

        return response()->json([
            'enabled' => (bool) config('rikms.ai.enabled'),
            'data' => $this->analyses->presentLatest($document),
        ]);
    }

    public function store(Request $request, Document $document)
    {
        $this->authorize('update', $document);
        $analysis = $this->analyses->queue($document, $request->user());
        $this->audit->log('document AI analysis queued', $document, [
            'analysis_id' => $analysis->id,
            'model' => $analysis->model,
        ], $request);

        return response()->json([
            'message' => 'Document analysis queued.',
            'data' => $this->analyses->present($analysis->load(['requester', 'reviewer'])),
        ], 202);
    }

    public function accept(Request $request, Document $document, DocumentAiAnalysis $analysis)
    {
        $this->authorize('update', $document);
        abort_unless((int) $analysis->document_id === (int) $document->id, 404);
        abort_unless($analysis->status === 'completed', 409, 'Only completed suggestions can be reviewed.');

        $validated = $request->validate([
            'accepted_fields' => ['required', 'array', 'min:1'],
            'accepted_fields.*' => ['string', 'distinct', 'in:'.implode(',', self::REVIEWABLE_FIELDS)],
        ]);
        $analysis->update([
            'status' => 'reviewed',
            'accepted_fields' => array_values($validated['accepted_fields']),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);
        $this->audit->log('document AI suggestions reviewed', $document, [
            'analysis_id' => $analysis->id,
            'accepted_fields' => $analysis->accepted_fields,
        ], $request);

        return response()->json([
            'message' => 'AI suggestions recorded as human-reviewed.',
            'data' => $this->analyses->present($analysis->fresh(['requester', 'reviewer'])),
        ]);
    }
}
