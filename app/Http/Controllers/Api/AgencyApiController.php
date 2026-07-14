<?php

namespace App\Http\Controllers\Api;

use App\Models\AccessRequest;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\DownloadEvent;
use App\Services\AuditLogService;
use App\Services\RikmsPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AgencyApiController extends RikmsApiController
{
    public function __construct(
        private readonly RikmsPresenter $presenter,
        private readonly AuditLogService $audit,
    ) {}

    public function dashboard(Request $request)
    {
        $agencyId = (int) $request->user()->agency_id;
        $documents = Document::query()->where('agency_id', $agencyId);
        $statusCounts = (clone $documents)->select('status', DB::raw('COUNT(*) as aggregate'))->groupBy('status')->pluck('aggregate', 'status');
        $totalDownloads = (int) (clone $documents)->sum('download_count');
        $canManageAccess = $request->user()->hasPermission('access_requests.manage');
        $pendingRequests = AccessRequest::query()->whereHas('document', fn (Builder $query) => $query->where('agency_id', $agencyId))->where('status', 'pending');
        $recent = (clone $documents)->with($this->documentRelations())->latest('updated_at')->limit(8)->get();

        return response()->json(['data' => [
            'statistics' => [
                'totalResearch' => (int) $statusCounts->sum(), 'drafts' => (int) ($statusCounts['draft'] ?? 0),
                'pending' => (int) ($statusCounts['pending'] ?? 0), 'published' => (int) ($statusCounts['published'] ?? 0),
                'rejected' => (int) ($statusCounts['rejected'] ?? 0), 'archived' => (int) ($statusCounts['archived'] ?? 0),
                'totalDownloads' => $totalDownloads, 'pendingAccessRequests' => $canManageAccess ? (clone $pendingRequests)->count() : 0,
            ],
            'recentDocuments' => $recent->map(fn (Document $document) => $this->presenter->document($document, true))->values(),
            'pendingAccessRequests' => $canManageAccess
                ? $pendingRequests->with(['document.metadata', 'requester'])->latest()->limit(5)->get()
                    ->map(fn (AccessRequest $item) => $this->presenter->accessRequest($item))->values()
                : [],
            'statusBreakdown' => $statusCounts->map(fn ($count, $status) => ['name' => str($status)->headline()->toString(), 'value' => (int) $count])->values(),
            'monthlySubmissions' => $this->monthlyAggregate((clone $documents)->whereNotNull('submitted_at'), 'submitted_at'),
        ]]);
    }

    public function documents(Request $request)
    {
        $query = $this->agencyDocuments($request)->where('status', '!=', 'archived');
        $this->documentFilters($query, $request);

        return $this->paginated($query->latest('updated_at')->paginate($this->perPage()), fn (Document $document) => $this->presenter->document($document, true));
    }

    public function archive(Request $request)
    {
        $query = $this->agencyDocuments($request)->where('status', 'archived');
        $this->documentFilters($query, $request, false);

        return $this->paginated($query->latest('archived_at')->paginate($this->perPage()), fn (Document $document) => $this->presenter->document($document, true));
    }

    public function accessRequests(Request $request)
    {
        $query = AccessRequest::query()->with(['document.metadata', 'requester', 'decisionMaker'])
            ->whereHas('document', fn (Builder $query) => $query->where('agency_id', $request->user()->agency_id));
        $query->when($request->filled('status'), fn (Builder $query) => $query->where('status', $request->query('status')));
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn (Builder $query) => $query->where('requester_name', 'like', "%{$search}%")
                ->orWhere('requester_email', 'like', "%{$search}%")
                ->orWhereHas('document', fn (Builder $doc) => $doc->where('title', 'like', "%{$search}%")));
        }

        return $this->paginated($query->latest()->paginate($this->perPage()), fn (AccessRequest $item) => $this->presenter->accessRequest($item));
    }

    public function analytics(Request $request)
    {
        $agencyId = (int) $request->user()->agency_id;
        $documents = Document::query()->where('agency_id', $agencyId);
        $statistics = (clone $documents)->toBase()->selectRaw('COUNT(*) as total_research')
            ->selectRaw("SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published")
            ->selectRaw('COALESCE(SUM(download_count), 0) as total_downloads')->first();
        $byYear = (clone $documents)->toBase()->whereNotNull('year')->select('year', DB::raw('COUNT(*) as aggregate'))
            ->groupBy('year')->orderBy('year')->get()->map(fn ($row) => ['year' => (int) $row->year, 'count' => (int) $row->aggregate]);
        $byCategory = (clone $documents)->toBase()->select('category', DB::raw('COUNT(*) as aggregate'))
            ->groupBy('category')->orderByDesc('aggregate')->get()
            ->map(fn ($row) => ['name' => $row->category ?: 'Uncategorized', 'value' => (int) $row->aggregate]);
        $downloads = DownloadEvent::query()->whereHas('document', fn (Builder $query) => $query->where('agency_id', $agencyId));
        $top = (clone $documents)->with($this->documentRelations())->orderByDesc('download_count')->limit(10)->get();

        return response()->json(['data' => [
            'statistics' => [
                'totalResearch' => (int) ($statistics->total_research ?? 0),
                'published' => (int) ($statistics->published ?? 0),
                'totalDownloads' => (int) ($statistics->total_downloads ?? 0),
                'totalAccessRequests' => AccessRequest::query()->whereHas('document', fn (Builder $query) => $query->where('agency_id', $agencyId))->count(),
            ],
            'documentsByYear' => $byYear->values(),
            'documentsByCategory' => $byCategory->values(),
            'downloadsByMonth' => $this->monthlyAggregate($downloads, 'created_at'),
            'topDocuments' => $top->map(fn (Document $document) => $this->presenter->document($document, true))->values(),
        ]]);
    }

    public function activity(Request $request)
    {
        $query = AuditLog::query()->with(['document.metadata', 'user', 'agency'])
            ->where('agency_id', $request->user()->agency_id);
        $query->when($request->filled('action'), fn (Builder $query) => $query->where('action', 'like', '%'.$request->query('action').'%'));
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn (Builder $query) => $query->where('action', 'like', "%{$search}%")
                ->orWhereHas('user', fn (Builder $user) => $user->where('name', 'like', "%{$search}%"))
                ->orWhereHas('document', fn (Builder $document) => $document->where('title', 'like', "%{$search}%")
                    ->orWhereHas('metadata', fn (Builder $metadata) => $metadata->where('title', 'like', "%{$search}%"))));
        }

        return $this->paginated($query->latest()->paginate($this->perPage()), fn (AuditLog $log) => $this->presenter->audit($log));
    }

    public function profile(Request $request)
    {
        $agency = $request->user()->agency;

        return response()->json(['data' => $this->agencyProfile($agency, $request)]);
    }

    public function updateProfile(Request $request)
    {
        $aliases = [];
        if ($request->has('contactEmail')) {
            $aliases['contact_email'] = $request->input('contactEmail');
        }
        if ($request->has('contactPhone')) {
            $aliases['phone'] = $request->input('contactPhone');
        }
        if ($request->has('userName')) {
            $aliases['user_name'] = $request->input('userName');
        }
        $request->merge($aliases);
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'abbreviation' => ['nullable', 'string', 'max:32'],
            'region' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:5000'],
            'contact_email' => ['nullable', 'email:rfc', 'max:255'],
            'phone' => ['nullable', 'string', 'max:64'],
            'website' => ['nullable', 'url:http,https', 'max:2048'],
            'address' => ['nullable', 'string', 'max:1000'],
            'user_name' => ['nullable', 'string', 'max:255'],
        ]);
        $agency = $request->user()->agency;
        DB::transaction(function () use ($agency, $request, $validated): void {
            $agency->update(collect($validated)->except('user_name')->all());
            if (! empty($validated['user_name'])) {
                $request->user()->update(['name' => $validated['user_name']]);
            }
        });
        $this->audit->log('agency profile updated', null, ['changed_fields' => array_keys($validated)], $request);

        return response()->json(['message' => 'Agency profile updated.', 'data' => $this->agencyProfile($agency->fresh(), $request)]);
    }

    public function settings(Request $request)
    {
        return response()->json(['data' => $this->agencySettings($request->user()->agency->settings ?? [])]);
    }

    public function updateSettings(Request $request)
    {
        $request->merge([
            'default_access_mode' => $request->input('defaultAccessMode', $request->input('default_access_mode')),
            'notify_access_requests' => $request->input('notifyAccessRequests', $request->input('notify_access_requests')),
            'notify_review_decisions' => $request->input('notifyReviewUpdates', $request->input('notify_review_decisions')),
            'weekly_digest' => $request->input('notifyWeeklySummary', $request->input('weekly_digest')),
        ]);
        $validated = $request->validate([
            'default_access_mode' => ['required', 'in:public_download,request_access,restricted_admin,embargo_until_date,external_link_only'],
            'notify_access_requests' => ['required', 'boolean'],
            'notify_review_decisions' => ['required', 'boolean'],
            'weekly_digest' => ['required', 'boolean'],
            'timezone' => ['required', 'timezone:all'],
        ]);
        $request->user()->agency->update(['settings' => $validated]);
        $this->audit->log('agency settings updated', null, ['changed_fields' => array_keys($validated)], $request);

        return response()->json(['message' => 'Agency settings updated.', 'data' => $this->agencySettings($validated)]);
    }

    private function agencyDocuments(Request $request): Builder
    {
        return Document::query()->where('agency_id', $request->user()->agency_id)->with($this->documentRelations());
    }

    private function documentRelations(): array
    {
        return ['metadata', 'publicFields', 'sdgTags', 'agency', 'uploader', 'performanceRows', 'financial', 'papClassifications', 'highlights'];
    }

    private function documentFilters(Builder $query, Request $request, bool $status = true): void
    {
        if ($status) {
            $query->when($request->filled('status'), fn (Builder $query) => $query->where('status', $request->query('status')));
        }
        $query->when($request->integer('year'), fn (Builder $query, int $year) => $query->where('year', $year));
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn (Builder $query) => $query->where('title', 'like', "%{$search}%")
                ->orWhere('category', 'like', "%{$search}%")
                ->orWhereHas('metadata', fn (Builder $meta) => $meta->where('title', 'like', "%{$search}%")
                    ->orWhere(fn (Builder $authors) => $this->whereJsonTextLike($authors, 'authors', $search))
                    ->orWhere(fn (Builder $keywords) => $this->whereJsonTextLike($keywords, 'keywords', $search))));
        }
    }

    private function whereJsonTextLike(Builder $query, string $column, string $search): Builder
    {
        $cast = in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)
            ? "CAST({$column} AS CHAR)" : "CAST({$column} AS TEXT)";

        return $query->whereRaw("LOWER({$cast}) LIKE ?", ['%'.mb_strtolower($search).'%']);
    }

    private function monthlyAggregate(Builder $query, string $column): array
    {
        $expression = match (DB::connection()->getDriverName()) {
            'pgsql' => "TO_CHAR({$column}, 'YYYY-MM')",
            'mysql', 'mariadb' => "DATE_FORMAT({$column}, '%Y-%m')",
            default => "strftime('%Y-%m', {$column})",
        };

        return $query->toBase()->selectRaw("{$expression} as month, COUNT(*) as aggregate")
            ->groupBy(DB::raw($expression))->orderBy('month')->get()
            ->map(fn ($row) => ['month' => $row->month, 'count' => (int) $row->aggregate])->values()->all();
    }

    private function agencyProfile($agency, Request $request): array
    {
        return [
            'id' => $agency->id, 'name' => $agency->name, 'abbreviation' => $agency->abbreviation(),
            'region' => $agency->region, 'type' => $agency->resolvedType(), 'description' => $agency->description,
            'contactEmail' => $agency->contact_email, 'contactPhone' => $agency->phone,
            'website' => $agency->website, 'address' => $agency->address,
        ];
    }

    private function agencySettings(array $settings): array
    {
        $settings = array_replace([
            'default_access_mode' => 'request_access', 'notify_access_requests' => true,
            'notify_review_decisions' => true, 'weekly_digest' => false, 'timezone' => 'Asia/Manila',
        ], $settings);

        return [
            'defaultAccessMode' => $settings['default_access_mode'],
            'notifyAccessRequests' => (bool) $settings['notify_access_requests'],
            'notifyReviewUpdates' => (bool) $settings['notify_review_decisions'],
            'notifyWeeklySummary' => (bool) $settings['weekly_digest'],
            'timezone' => $settings['timezone'],
        ];
    }
}
