<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreAccessRequestRequest;
use App\Models\Agency;
use App\Models\Document;
use App\Models\SdgTag;
use App\Services\AccessRequestService;
use App\Services\DocumentDownloadService;
use App\Services\PlatformSettingsService;
use App\Services\RikmsPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use App\Models\AccessRequest;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;

class PublicApiController extends RikmsApiController
{
    public function __construct(
        private readonly RikmsPresenter $presenter,
        private readonly AccessRequestService $accessRequests,
        private readonly DocumentDownloadService $downloads,
        private readonly PlatformSettingsService $settings,
    ) {}

    public function bootstrap(Request $request)
    {
        $settings = $this->settings->all();
        $browse = (bool) $settings['allow_public_browse'];
        $publicBase = Document::query()->where('status', 'published');
        $agencies = Agency::query()->where(fn (Builder $query) => $query->where('is_active', true)
            ->orWhereHas('documents', fn (Builder $documents) => $documents->where('status', 'published')))
            ->withCount(['documents as publications_count' => fn (Builder $query) => $query->where('status', 'published')])
            ->withMax(['documents as latest_publication_year' => fn (Builder $query) => $query->where('status', 'published')], 'year')
            ->orderBy('name')->get();
        $sdgs = SdgTag::query()
            ->withCount(['documents' => fn (Builder $query) => $query->where('status', 'published')])
            ->orderBy('number')->get();
        $user = $request->user()?->is_active ? $request->user()->load('agency') : null;

        // 1. Documents visibility filtering
        $documentsQuery = Document::query()
            ->with(['metadata', 'sdgTags', 'agency', 'uploader']);

        if (!$user) {
            $documentsQuery->where('status', 'published');
        } elseif ($user->role !== 'super_admin') {
            $documentsQuery->where(function ($query) use ($user) {
                $query->where('status', 'published')
                      ->orWhere('agency_id', $user->agency_id);
            });
        }
        $documents = $documentsQuery->latest('updated_at')->get();

        // 2. Access Requests filtering
        $accessRequestsQuery = AccessRequest::query()
            ->with(['document.metadata', 'requester'])
            ->latest()
            ->take(50);

        if (!$user) {
            $accessRequests = collect();
        } elseif ($user->role !== 'super_admin') {
            $accessRequests = $accessRequestsQuery->whereHas('document', function ($query) use ($user) {
                $query->where('agency_id', $user->agency_id);
            })->get();
        } else {
            $accessRequests = $accessRequestsQuery->get();
        }

        // 3. Audit Logs filtering
        $auditLogsQuery = AuditLog::query()
            ->with(['document.metadata', 'user'])
            ->latest()
            ->take(75);

        if (!$user) {
            $auditLogs = collect();
        } elseif ($user->role !== 'super_admin') {
            $auditLogs = $auditLogsQuery->where(function ($query) use ($user) {
                $query->whereHas('document', function ($docQuery) use ($user) {
                    $docQuery->where('agency_id', $user->agency_id);
                })->orWhere('user_id', $user->id);
            })->get();
        } else {
            $auditLogs = $auditLogsQuery->get();
        }

        $data = [
            'currentUser' => $user ? [
                'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
                'role' => $user->role, 'agencyId' => $user->agency_id,
                'agencyName' => $user->agency?->name, 'agencyAbbr' => $user->agency?->abbreviation(),
            ] : null,
            'sdgData' => $sdgs->map(fn (SdgTag $sdg) => [
                'number' => $sdg->number, 'title' => $sdg->name, 'color' => $sdg->color,
            ])->values(),
            'sdgResearchCounts' => $sdgs->mapWithKeys(fn (SdgTag $sdg) => [$sdg->number => $browse ? $sdg->documents_count : 0]),
            'agencies' => $agencies->map(fn (Agency $agency) => [
                'id' => $agency->id, 'name' => $agency->name, 'abbreviation' => $agency->abbreviation(),
                'type' => $agency->resolvedType(), 'publications' => $browse ? $agency->publications_count : 0,
                'description' => $agency->description ?: 'Participating institution in the RIKMS research repository.',
                'region' => $agency->region, 'address' => $agency->address,
                'contactEmail' => $agency->contact_email, 'contactPhone' => $agency->phone,
                'website' => $agency->website,
                'isActive' => $agency->is_active,
                'latestYear' => $browse ? $agency->latest_publication_year : null,
            ])->values(),
            'researchCategories' => $browse ? (clone $publicBase)->whereNotNull('category')->distinct()->orderBy('category')->pluck('category')->values() : [],
            'statistics' => [
                'totalResearch' => $browse ? (clone $publicBase)->count() : 0, 'participatingAgencies' => $agencies->count(),
                'sdgsCovered' => $browse ? $sdgs->where('documents_count', '>', 0)->count() : 0,
                'latestPublications' => $browse ? (clone $publicBase)->where('published_at', '>=', now()->subDays(30))->count() : 0,
            ],
            'platform' => [
                'siteName' => $settings['site_name'], 'supportEmail' => $settings['support_email'],
                'announcement' => $settings['announcement'], 'allowPublicBrowse' => $browse,
            ],
            'researchData' => $documents->map(fn (Document $document) => [
                'id' => $document->id,
                'title' => $document->title,
                'description' => $document->description,
                'year' => $document->year,
                'quarter' => $document->quarter,
                'docType' => $document->document_type,
                'status' => $document->status,
                'accessMode' => $document->access_mode,
                'agency' => $document->agency?->name,
                'agencyAbbr' => $document->agency?->abbreviation(),
                'sdgs' => $document->sdgTags->pluck('number')->toArray(),
                'authors' => is_array($document->metadata?->authors) ? $document->metadata->authors : ($document->metadata?->authors ? array_map('trim', explode(',', $document->metadata->authors)) : []),
                'downloads' => $document->downloads ?? 0,
                'malware_status' => $document->malware_status,
                'extracted_text' => $document->extracted_text,
            ])->values(),
        ];

        if ($user) {
            $data['accessRequests'] = $accessRequests->map(fn (AccessRequest $request) => [
                'id' => $request->id,
                'documentId' => $request->document_id,
                'documentTitle' => $request->document?->title,
                'requesterName' => $request->requester?->name,
                'requesterEmail' => $request->requester?->email,
                'status' => $request->status,
                'createdAt' => $request->created_at?->toDateTimeString(),
            ])->values();

            $data['auditLogs'] = $auditLogs->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'details' => $log->details,
                'userName' => $log->user?->name,
                'documentTitle' => $log->document?->title,
                'createdAt' => $log->created_at?->toDateTimeString(),
            ])->values();
        }

        return response()->json($data);
    }

    public function index(Request $request)
    {
        abort_unless($this->settings->get('allow_public_browse'), 403, 'Public browsing is temporarily disabled.');
        $query = $this->publicDocuments();
        $this->filters($query, $request);

        return $this->paginated($query->latest('published_at')->paginate($this->perPage()), fn (Document $document) => $this->presenter->document($document));
    }

    public function show(Document $document)
    {
        abort_unless($this->settings->get('allow_public_browse') && $document->status === 'published', 404);

        return response()->json(['data' => $this->presenter->document($document)]);
    }

    public function requestAccess(StoreAccessRequestRequest $request, Document $document)
    {
        abort_unless($this->settings->get('allow_public_browse'), 403, 'Public browsing is temporarily disabled.');
        $accessRequest = $this->accessRequests->create($document, $request->validated(), $request);

        return response()->json([
            'message' => 'Your access request has been submitted for review.',
            'data' => ['id' => $accessRequest->id, 'status' => $accessRequest->status],
        ], 201);
    }

    public function download(Request $request, Document $document)
    {
        abort_unless($this->settings->get('allow_public_browse'), 403, 'Public access is temporarily disabled.');

        return $this->downloads->response($document, $request);
    }

    private function publicDocuments(): Builder
    {
        return Document::query()->where('status', 'published')->with(['metadata', 'publicFields', 'sdgTags', 'agency']);
    }

    private function filters(Builder $query, Request $request): void
    {
        if ($search = trim((string) $request->query('search'))) {
            $query->where(function (Builder $query) use ($search): void {
                $query->where(function (Builder $titleQuery) use ($search): void {
                    $titleQuery->whereHas('publicFields', fn (Builder $fields) => $fields
                        ->where('field_name', 'title')->where('is_public', true))
                        ->where(fn (Builder $title) => $title->where('title', 'like', "%{$search}%")
                            ->orWhereHas('metadata', fn (Builder $meta) => $meta->where('title', 'like', "%{$search}%")));
                })->orWhere(function (Builder $abstractQuery) use ($search): void {
                    $abstractQuery->whereHas('publicFields', fn (Builder $fields) => $fields
                        ->where('field_name', 'abstract')->where('is_public', true))
                        ->whereHas('metadata', fn (Builder $meta) => $meta->where('abstract', 'like', "%{$search}%"));
                })->orWhere(function (Builder $authorQuery) use ($search): void {
                    $authorQuery->whereHas('publicFields', fn (Builder $fields) => $fields
                        ->where('field_name', 'authors')->where('is_public', true))
                        ->whereHas('metadata', fn (Builder $meta) => $this->whereJsonTextLike($meta, 'authors', $search));
                })->orWhere(function (Builder $keywordQuery) use ($search): void {
                    $keywordQuery->whereHas('publicFields', fn (Builder $fields) => $fields
                        ->where('field_name', 'keywords')->where('is_public', true))
                        ->whereHas('metadata', fn (Builder $meta) => $this->whereJsonTextLike($meta, 'keywords', $search));
                });
            });
        }
        $query->when($request->integer('agency'), fn (Builder $query, int $id) => $query->where('agency_id', $id));
        $query->when($request->integer('year'), fn (Builder $query, int $year) => $query->where('year', $year));
        $query->when($request->filled('category'), fn (Builder $query) => $query->where('category', $request->query('category')));
        $query->when($request->integer('sdg'), fn (Builder $query, int $number) => $query->whereHas('sdgTags', fn (Builder $sdg) => $sdg->where('number', $number)));
    }

    private function whereJsonTextLike(Builder $query, string $column, string $search): Builder
    {
        $cast = in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)
            ? "CAST({$column} AS CHAR)" : "CAST({$column} AS TEXT)";

        return $query->whereRaw("LOWER({$cast}) LIKE ?", ['%'.mb_strtolower($search).'%']);
    }
}
