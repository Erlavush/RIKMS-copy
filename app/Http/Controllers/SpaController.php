<?php

namespace App\Http\Controllers;

use App\Models\AccessRequest;
use App\Models\Agency;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\SdgTag;
use Illuminate\Support\Facades\Auth;

class SpaController extends Controller
{
    public function __invoke()
    {
        return view('spa', [
            'bootstrap' => $this->payload(),
        ]);
    }

    public function bootstrap()
    {
        return response()->json($this->payload());
    }

    private function payload(): array
    {
        $documents = Document::query()
            ->with(['metadata', 'sdgTags', 'agency', 'uploader'])
            ->latest('updated_at')
            ->get();

        $agencies = Agency::query()
            ->withCount('documents')
            ->orderBy('name')
            ->get();

        $sdgs = SdgTag::query()
            ->withCount('documents')
            ->orderBy('number')
            ->get();

        $currentUser = Auth::user()?->load('agency');

        return [
            'currentUser' => $currentUser ? [
                'id' => $currentUser->id,
                'name' => $currentUser->name,
                'email' => $currentUser->email,
                'role' => $currentUser->role,
                'agencyId' => $currentUser->agency_id,
                'agencyName' => $currentUser->agency?->name,
                'agencyAbbr' => $currentUser->agency ? $this->agencyAbbreviation($currentUser->agency->name) : null,
            ] : null,
            'sdgData' => $sdgs->map(fn (SdgTag $sdg) => [
                'number' => $sdg->number,
                'title' => $sdg->name,
                'color' => $sdg->color,
            ])->values(),
            'sdgResearchCounts' => $sdgs
                ->mapWithKeys(fn (SdgTag $sdg) => [$sdg->number => $sdg->documents_count])
                ->all(),
            'agencies' => $agencies->map(fn (Agency $agency) => [
                'id' => $agency->id,
                'name' => $agency->name,
                'abbreviation' => $this->agencyAbbreviation($agency->name),
                'type' => $this->agencyType($agency->name),
                'publications' => $agency->documents_count,
                'description' => $agency->region
                    ? "Research and innovation records for {$agency->region}."
                    : 'Participating institution in the RIKMS research repository.',
                'latestYear' => $agency->documents()->max('year') ?: now()->year,
            ])->values(),
            'researchData' => $documents->map(fn (Document $document) => [
                'id' => $document->id,
                'title' => $document->metadata?->title ?: $document->title ?: 'Untitled research record',
                'authors' => $document->metadata?->authors ?: [$document->uploader?->name ?: 'Agency research team'],
                'agency' => $document->agency?->name ?: 'Unassigned agency',
                'agencyAbbr' => $document->agency ? $this->agencyAbbreviation($document->agency->name) : 'N/A',
                'year' => $document->year ?: now()->year,
                'abstract' => $document->metadata?->abstract ?: $document->description ?: 'No abstract has been provided yet.',
                'keywords' => $document->metadata?->keywords ?: [],
                'sdgs' => $document->sdgTags->pluck('number')->values(),
                'category' => $document->category ?: $document->documentTypeLabel(),
                'doi' => $document->metadata?->doi,
                'fileType' => strtoupper(pathinfo($document->original_filename ?: 'document.pdf', PATHINFO_EXTENSION) ?: 'PDF'),
                'downloads' => 100 + ($document->id * 37),
                'status' => $document->status,
                'accessMode' => $document->access_mode,
                'completionScore' => $document->completion_score,
                'isAiTagged' => $document->is_ai_tagged,
            ])->values(),
            'researchCategories' => $documents
                ->pluck('category')
                ->filter()
                ->unique()
                ->values(),
            'statistics' => [
                'totalResearch' => $documents->count(),
                'participatingAgencies' => $agencies->count(),
                'sdgsCovered' => $sdgs->where('documents_count', '>', 0)->count(),
                'latestPublications' => $documents->where('published_at', '!=', null)->count(),
            ],
            'accessRequests' => AccessRequest::query()
                ->with(['document.metadata', 'requester'])
                ->latest()
                ->take(50)
                ->get()
                ->map(fn (AccessRequest $request) => [
                    'id' => $request->id,
                    'documentId' => $request->document_id,
                    'title' => $request->document?->metadata?->title ?: $request->document?->title,
                    'requesterName' => $request->requester_name,
                    'requesterEmail' => $request->requester_email,
                    'message' => $request->message,
                    'status' => $request->status,
                    'createdAt' => $request->created_at?->toDateTimeString(),
                ])->values(),
            'auditLogs' => AuditLog::query()
                ->with(['document.metadata', 'user'])
                ->latest()
                ->take(75)
                ->get()
                ->map(fn (AuditLog $log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'user' => $log->user?->name,
                    'documentTitle' => $log->document?->metadata?->title ?: $log->document?->title,
                    'createdAt' => $log->created_at?->toDateTimeString(),
                    'details' => $log->details,
                ])->values(),
        ];
    }

    private function agencyAbbreviation(string $name): string
    {
        $known = [
            'Department of Science and Technology' => 'DOST XI',
            'Commission on Higher Education' => 'CHED XI',
            'National Economic and Development Authority' => 'NEDA XI',
            'Department of Trade and Industry' => 'DTI XI',
            'Department of Information and Communications Technology' => 'DICT XI',
            'University of Southeastern Philippines' => 'USEP',
        ];

        foreach ($known as $needle => $abbr) {
            if (str_contains($name, $needle)) {
                return $abbr;
            }
        }

        return str($name)
            ->replace(['-', '–'], ' ')
            ->explode(' ')
            ->filter(fn (string $word) => ctype_upper(substr($word, 0, 1)))
            ->map(fn (string $word) => strtoupper(substr($word, 0, 1)))
            ->take(5)
            ->join('') ?: 'AGENCY';
    }

    private function agencyType(string $name): string
    {
        if (str_contains($name, 'University') || str_contains($name, 'College')) {
            return 'Higher Education Institution';
        }

        if (str_contains($name, 'Consortium')) {
            return 'Research Consortium';
        }

        return 'Government Agency';
    }
}
