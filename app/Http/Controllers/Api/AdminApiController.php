<?php

namespace App\Http\Controllers\Api;

use App\Models\AccessRequest;
use App\Models\Agency;
use App\Models\AuditLog;
use App\Models\AuthenticationEvent;
use App\Models\Document;
use App\Models\DownloadEvent;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\PlatformSettingsService;
use App\Services\RikmsPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminApiController extends RikmsApiController
{
    public function __construct(
        private readonly RikmsPresenter $presenter,
        private readonly PlatformSettingsService $settingsService,
        private readonly AuditLogService $audit,
    ) {}

    public function dashboard()
    {
        $statusCounts = Document::query()->select('status', DB::raw('COUNT(*) as aggregate'))->groupBy('status')->pluck('aggregate', 'status');
        $recentDocuments = Document::query()->with($this->documentRelations())->latest('updated_at')->limit(8)->get();
        $recentActivity = AuditLog::query()->with(['document.metadata', 'user', 'agency'])->latest()->limit(8)->get();

        return response()->json(['data' => [
            'statistics' => [
                'totalDocuments' => (int) $statusCounts->sum(), 'publishedDocuments' => (int) ($statusCounts['published'] ?? 0),
                'pendingReview' => (int) ($statusCounts['pending'] ?? 0), 'totalAgencies' => Agency::query()->where('is_active', true)->count(),
                'totalUsers' => User::query()->where('is_active', true)->count(),
                'pendingAccessRequests' => AccessRequest::query()->where('status', 'pending')->count(),
                'totalDownloads' => (int) Document::query()->sum('download_count'),
            ],
            'recentDocuments' => $recentDocuments->map(fn (Document $document) => $this->presenter->document($document, true))->values(),
            'recentActivity' => $recentActivity->map(fn (AuditLog $log) => $this->presenter->audit($log))->values(),
            'statusBreakdown' => $statusCounts->map(fn ($count, $status) => ['name' => str($status)->headline()->toString(), 'value' => (int) $count])->values(),
            'monthlySubmissions' => $this->monthlyAggregate(Document::query()->whereNotNull('submitted_at'), 'submitted_at'),
        ]]);
    }

    public function agencies(Request $request)
    {
        $query = Agency::query()
            ->withCount(['users', 'documents', 'documents as published_count' => fn (Builder $query) => $query->where('status', 'published')]);
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn (Builder $query) => $query->where('name', 'like', "%{$search}%")
                ->orWhere('abbreviation', 'like', "%{$search}%")
                ->orWhere('region', 'like', "%{$search}%"));
        }

        return $this->paginated($query->orderBy('name')->paginate($this->perPage()), fn (Agency $agency) => $this->presentAgency($agency));
    }

    public function storeAgency(Request $request)
    {
        $agency = Agency::create($this->validateAgency($request));
        $this->audit->log('agency created', null, ['agency_id' => $agency->id, '_agency_id' => $agency->id], $request);

        return response()->json(['message' => 'Agency created.', 'data' => $this->presentAgency($agency)], 201);
    }

    public function updateAgency(Request $request, Agency $agency)
    {
        $validated = $this->validateAgency($request, $agency);
        $deactivating = $agency->is_active && array_key_exists('is_active', $validated) && $validated['is_active'] === false;
        $agency->update($validated);
        if ($deactivating) {
            $userIds = $agency->users()->pluck('id');
            User::query()->where('agency_id', $agency->id)->get()
                ->each(fn (User $user) => $user->forceFill(['remember_token' => Str::random(60)])->save());
            DB::table('sessions')->whereIn('user_id', $userIds)->delete();
        }
        $this->audit->log('agency updated', null, ['agency_id' => $agency->id, 'changed_fields' => array_keys($validated), '_agency_id' => $agency->id], $request);

        return response()->json(['message' => 'Agency updated.', 'data' => $this->presentAgency($agency->fresh())]);
    }

    public function users(Request $request)
    {
        $query = User::query()->with('agency');
        $query->when($request->filled('role'), fn (Builder $query) => $query->where('role', $request->query('role')));
        $query->when($request->integer('agency_id'), fn (Builder $query, int $agency) => $query->where('agency_id', $agency));
        $query->when($request->filled('status'), fn (Builder $query) => $query->where('is_active', $request->query('status') === 'active'));
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn (Builder $query) => $query->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }

        return $this->paginated($query->latest()->paginate($this->perPage()), fn (User $user) => $this->presentUser($user));
    }

    public function storeUser(Request $request)
    {
        $validated = $this->validateUser($request);
        $validated['must_change_password'] = true;
        $user = new User;
        $user->fill($validated);
        $user->save();
        $this->audit->log('user created', null, ['managed_user_id' => $user->id, 'role' => $user->role, '_agency_id' => $user->agency_id], $request);

        return response()->json(['message' => 'User created.', 'data' => $this->presentUser($user->load('agency'))], 201);
    }

    public function updateUser(Request $request, User $user)
    {
        $validated = $this->validateUser($request, $user);
        if (array_key_exists('password', $validated)) {
            $validated['must_change_password'] = true;
        }
        if ((int) $request->user()->id === (int) $user->id && (($validated['is_active'] ?? true) === false || ($validated['role'] ?? $user->role) !== 'super_admin')) {
            throw ValidationException::withMessages(['role' => 'You cannot deactivate or demote your own administrator account.']);
        }
        if ($user->role === 'super_admin' && ($validated['role'] ?? 'super_admin') !== 'super_admin'
            && User::query()->where('role', 'super_admin')->where('is_active', true)->count() <= 1) {
            throw ValidationException::withMessages(['role' => 'At least one active super administrator is required.']);
        }
        $securityChanged = array_key_exists('password', $validated)
            || array_key_exists('role', $validated)
            || array_key_exists('agency_id', $validated)
            || (array_key_exists('is_active', $validated) && ! $validated['is_active']);
        $user->update($validated);
        if ($securityChanged) {
            $user->forceFill(['remember_token' => Str::random(60)])->save();
            DB::table('sessions')->where('user_id', $user->id)->delete();
        }
        $this->audit->log('user updated', null, [
            'managed_user_id' => $user->id, 'changed_fields' => array_values(array_diff(array_keys($validated), ['password'])),
            'password_changed' => array_key_exists('password', $validated), '_agency_id' => $user->agency_id,
        ], $request);

        return response()->json(['message' => 'User updated.', 'data' => $this->presentUser($user->fresh('agency'))]);
    }

    public function documents(Request $request)
    {
        return $this->documentList($request, false);
    }

    public function moderation(Request $request)
    {
        $request->merge(['status' => $request->query('status', 'pending')]);

        return $this->documentList($request, false);
    }

    public function showDocument(Document $document)
    {
        return response()->json(['data' => $this->presenter->document($document->load($this->documentRelations()), true)]);
    }

    public function accessRequests(Request $request)
    {
        $query = AccessRequest::query()->with(['document.metadata', 'requester', 'decisionMaker']);
        $query->when($request->filled('status'), fn (Builder $query) => $query->where('status', $request->query('status')));
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn (Builder $query) => $query->where('requester_name', 'like', "%{$search}%")
                ->orWhere('requester_email', 'like', "%{$search}%")
                ->orWhereHas('document', fn (Builder $doc) => $doc->where('title', 'like', "%{$search}%")));
        }

        return $this->paginated($query->latest()->paginate($this->perPage()), fn (AccessRequest $item) => $this->presenter->accessRequest($item));
    }

    public function analytics()
    {
        $status = Document::query()->select('status', DB::raw('COUNT(*) as aggregate'))->groupBy('status')->pluck('aggregate', 'status');
        $agencyCounts = Document::query()->toBase()->select('agency_id', DB::raw('COUNT(*) as aggregate'))
            ->groupBy('agency_id')->orderByDesc('aggregate')->get();
        $agencies = Agency::query()->whereIn('id', $agencyCounts->pluck('agency_id'))->get()->keyBy('id');
        $sdgCounts = DB::table('document_sdg')
            ->join('documents', 'documents.id', '=', 'document_sdg.document_id')
            ->join('sdg_tags', 'sdg_tags.id', '=', 'document_sdg.sdg_tag_id')
            ->select('sdg_tags.number', 'sdg_tags.name', DB::raw('COUNT(*) as aggregate'))
            ->groupBy('sdg_tags.number', 'sdg_tags.name')->orderBy('sdg_tags.number')->get();

        return response()->json(['data' => [
            'statistics' => [
                'totalDocuments' => (int) $status->sum(), 'publishedDocuments' => (int) ($status['published'] ?? 0),
                'totalDownloads' => (int) Document::query()->sum('download_count'), 'totalAgencies' => Agency::query()->count(),
            ],
            'statusBreakdown' => $status->map(fn ($count, $name) => ['name' => str($name)->headline()->toString(), 'value' => (int) $count])->values(),
            'agencyBreakdown' => $agencyCounts->map(fn ($row) => [
                'name' => $agencies->get($row->agency_id)?->abbreviation() ?? 'N/A', 'value' => (int) $row->aggregate,
            ])->values(),
            'sdgBreakdown' => $sdgCounts->map(fn ($row) => [
                'number' => (int) $row->number, 'name' => $row->name, 'value' => (int) $row->aggregate,
            ])->values(),
            'monthlySubmissions' => $this->monthlyAggregate(Document::query()->whereNotNull('submitted_at'), 'submitted_at'),
            'monthlyDownloads' => $this->monthlyAggregate(DownloadEvent::query(), 'created_at'),
        ]]);
    }

    public function auditLogs(Request $request)
    {
        $query = AuditLog::query()->with(['document.metadata', 'user', 'agency']);
        $query->when($request->filled('action'), fn (Builder $query) => $query->where('action', 'like', '%'.$request->query('action').'%'));
        $query->when($request->integer('user_id'), fn (Builder $query, int $user) => $query->where('user_id', $user));

        return $this->paginated($query->latest()->paginate($this->perPage()), fn (AuditLog $log) => $this->presenter->audit($log));
    }

    public function roles()
    {
        $roles = Role::query()->with('permissions')->withCount(['permissions'])->get();
        $userCounts = User::query()->select('role', DB::raw('COUNT(*) as aggregate'))->groupBy('role')->pluck('aggregate', 'role');

        return response()->json([
            'data' => $roles->map(fn (Role $role) => $this->presentRole($role, (int) ($userCounts[$role->name] ?? 0)))->values(),
            'permissions' => Permission::query()->orderBy('name')->get()->map(fn (Permission $permission) => [
                'name' => $permission->name, 'label' => $permission->label,
            ])->values(),
        ]);
    }

    public function updateRole(Request $request, Role $role)
    {
        if ($role->name === 'super_admin') {
            throw ValidationException::withMessages(['role' => 'The super administrator role is protected from modification.']);
        }
        $validated = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string', 'distinct', Rule::exists('permissions', 'name')],
        ]);
        $ids = Permission::query()->whereIn('name', $validated['permissions'])->pluck('id');
        $role->permissions()->sync($ids);
        $this->audit->log('role permissions updated', null, ['role' => $role->name, 'permissions' => $validated['permissions']], $request);

        return response()->json([
            'message' => 'Role permissions updated.',
            'data' => $this->presentRole($role->fresh('permissions'), User::query()->where('role', $role->name)->count()),
        ]);
    }

    public function archive(Request $request)
    {
        return $this->documentList($request, true);
    }

    public function settings()
    {
        return response()->json(['data' => $this->presentSettings($this->settingsService->all())]);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'site_name' => ['required', 'string', 'max:120'],
            'support_email' => ['nullable', 'email:rfc', 'max:255'],
            'allow_public_browse' => ['required', 'boolean'],
            'access_grant_days' => ['required', 'integer', 'between:1,30'],
            'announcement' => ['nullable', 'string', 'max:1000'],
        ]);
        $settings = $this->settingsService->update($validated, $request->user()->id);
        $this->audit->log('platform settings updated', null, ['changed_fields' => array_keys($validated)], $request);

        return response()->json(['message' => 'Platform settings updated.', 'data' => $this->presentSettings($settings)]);
    }

    public function security()
    {
        $dayAgo = now()->subDay();
        $recent = AuthenticationEvent::query()->with('user')->latest()->limit(30)->get();

        return response()->json(['data' => [
            'activeUsers' => User::query()->where('is_active', true)->count(),
            'admins' => User::query()->where('role', 'super_admin')->where('is_active', true)->count(),
            'failedLogins24h' => AuthenticationEvent::query()->where('successful', false)->where('created_at', '>=', $dayAgo)->count(),
            'recentLogins' => $recent->map(fn (AuthenticationEvent $event) => [
                'id' => $event->id, 'email' => $event->email, 'user' => $event->user?->name,
                'successful' => $event->successful, 'ipAddress' => $event->ip_address,
                'failureReason' => $event->failure_reason, 'createdAt' => $event->created_at->toISOString(),
            ])->values(),
            'securityEvents' => AuditLog::query()->where('event_type', 'security')->latest()->limit(20)->get()
                ->map(fn (AuditLog $log) => $this->presenter->audit($log))->values(),
            'passwordPolicy' => ['minimumLength' => 12, 'resetTokensExpireMinutes' => (int) config('auth.passwords.users.expire', 60)],
            'sessionLifetime' => (int) config('session.lifetime'),
        ]]);
    }

    private function documentList(Request $request, bool $archived)
    {
        $query = Document::query()->with($this->documentRelations())
            ->where('status', $archived ? '=' : '!=', 'archived');
        $query->when($request->filled('status') && ! $archived, fn (Builder $query) => $query->where('status', $request->input('status')));
        $query->when($request->integer('agency_id'), fn (Builder $query, int $agency) => $query->where('agency_id', $agency));
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn (Builder $query) => $query->where('title', 'like', "%{$search}%")
                ->orWhere('category', 'like', "%{$search}%")
                ->orWhereHas('metadata', fn (Builder $meta) => $meta->where('title', 'like', "%{$search}%")
                    ->orWhere(fn (Builder $authors) => $this->whereJsonTextLike($authors, 'authors', $search))
                    ->orWhere(fn (Builder $keywords) => $this->whereJsonTextLike($keywords, 'keywords', $search))));
        }

        return $this->paginated($query->latest($archived ? 'archived_at' : 'updated_at')->paginate($this->perPage()), fn (Document $document) => $this->presenter->document($document, true));
    }

    private function validateAgency(Request $request, ?Agency $agency = null): array
    {
        return $request->validate([
            'name' => [$agency ? 'sometimes' : 'required', 'string', 'max:255', Rule::unique('agencies')->ignore($agency)],
            'abbreviation' => ['nullable', 'string', 'max:32'], 'region' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:120'], 'description' => ['nullable', 'string', 'max:5000'],
            'contact_email' => ['nullable', 'email:rfc', 'max:255'], 'phone' => ['nullable', 'string', 'max:64'],
            'website' => ['nullable', 'url:http,https', 'max:2048'], 'address' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }

    private function validateUser(Request $request, ?User $user = null): array
    {
        $validated = $request->validate([
            'name' => [$user ? 'sometimes' : 'required', 'string', 'max:255'],
            'email' => [$user ? 'sometimes' : 'required', 'email:rfc', 'max:255', Rule::unique('users')->ignore($user)],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:12'],
            'role' => [$user ? 'sometimes' : 'required', Rule::in(['agency_admin', 'super_admin'])],
            'agency_id' => ['nullable', 'integer', 'exists:agencies,id'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        $role = $validated['role'] ?? $user?->role;
        if ($role === 'agency_admin' && ! ($validated['agency_id'] ?? $user?->agency_id)) {
            throw ValidationException::withMessages(['agency_id' => 'Agency administrators require an agency assignment.']);
        }
        if ($role === 'super_admin') {
            $validated['agency_id'] = null;
        }
        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        return $validated;
    }

    private function presentAgency(Agency $agency): array
    {
        return [
            'id' => $agency->id, 'name' => $agency->name, 'abbreviation' => $agency->abbreviation(),
            'region' => $agency->region, 'type' => $agency->resolvedType(), 'description' => $agency->description,
            'contactEmail' => $agency->contact_email, 'phone' => $agency->phone,
            'website' => $agency->website, 'address' => $agency->address, 'isActive' => $agency->is_active,
            'usersCount' => (int) ($agency->users_count ?? $agency->users()->count()),
            'documentsCount' => (int) ($agency->documents_count ?? $agency->documents()->count()),
            'publishedCount' => (int) ($agency->published_count ?? $agency->documents()->where('status', 'published')->count()),
            'createdAt' => $agency->created_at?->toISOString(),
        ];
    }

    private function presentUser(User $user): array
    {
        return [
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role,
            'agencyId' => $user->agency_id, 'agencyName' => $user->agency?->name,
            'isActive' => $user->is_active, 'mustChangePassword' => $user->must_change_password,
            'lastLoginAt' => $user->last_login_at?->toISOString(),
            'createdAt' => $user->created_at?->toISOString(),
        ];
    }

    private function presentRole(Role $role, int $userCount): array
    {
        return [
            'id' => $role->id, 'name' => $role->name, 'label' => $role->label,
            'isSystem' => $role->is_system, 'userCount' => $userCount,
            'permissions' => $role->permissions->pluck('name')->values(),
        ];
    }

    private function presentSettings(array $settings): array
    {
        return [
            'siteName' => $settings['site_name'], 'supportEmail' => $settings['support_email'],
            'allowPublicBrowse' => $settings['allow_public_browse'],
            'accessGrantDays' => $settings['access_grant_days'], 'announcement' => $settings['announcement'],
        ];
    }

    private function monthlyAggregate(Builder $query, string $field): array
    {
        $expression = match (DB::connection()->getDriverName()) {
            'pgsql' => "TO_CHAR({$field}, 'YYYY-MM')",
            'mysql', 'mariadb' => "DATE_FORMAT({$field}, '%Y-%m')",
            default => "strftime('%Y-%m', {$field})",
        };

        return $query->toBase()->selectRaw("{$expression} as month, COUNT(*) as aggregate")
            ->groupBy(DB::raw($expression))->orderBy('month')->get()
            ->map(fn ($row) => ['month' => $row->month, 'count' => (int) $row->aggregate])->values()->all();
    }

    private function documentRelations(): array
    {
        return ['metadata', 'publicFields', 'sdgTags', 'agency', 'uploader', 'performanceRows', 'financial', 'papClassifications', 'highlights'];
    }

    private function whereJsonTextLike(Builder $query, string $column, string $search): Builder
    {
        $cast = in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)
            ? "CAST({$column} AS CHAR)" : "CAST({$column} AS TEXT)";

        return $query->whereRaw("LOWER({$cast}) LIKE ?", ['%'.mb_strtolower($search).'%']);
    }
}
