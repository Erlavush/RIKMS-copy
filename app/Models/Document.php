<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $agency_id
 * @property int $uploaded_by
 * @property string $document_type
 * @property string|null $title
 * @property string|null $description
 * @property string|null $file_path
 * @property string|null $original_filename
 * @property string|null $mime_type
 * @property int|null $file_size
 * @property string $status
 * @property int|null $year
 * @property string|null $reporting_quarter
 * @property string|null $category
 * @property string $access_mode
 * @property Carbon|null $embargo_until
 * @property string|null $external_url
 * @property string|null $owner_name
 * @property string|null $owner_email
 * @property bool $notify_access_requests
 * @property bool $notify_research_inquiries
 * @property bool $send_copy_to_agency_admin
 * @property bool $is_ai_tagged
 * @property int $completion_score
 * @property int $digital_library_score
 * @property int $download_count
 * @property Carbon|null $submitted_at
 * @property Carbon|null $published_at
 * @property int|null $reviewed_by
 * @property Carbon|null $reviewed_at
 * @property string|null $rejection_reason
 * @property string|null $pre_archive_status
 * @property Carbon|null $archived_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Agency $agency
 * @property-read User $uploader
 * @property-read User|null $reviewer
 * @property-read DocumentMetadata|null $metadata
 * @property-read ReportFinancial|null $financial
 * @property-read Collection<int, PublicMetadataField> $publicFields
 * @property-read Collection<int, SdgTag> $sdgTags
 * @property-read Collection<int, AccessRequest> $accessRequests
 * @property-read Collection<int, ReportPerformanceRow> $performanceRows
 * @property-read Collection<int, PapClassification> $papClassifications
 * @property-read Collection<int, Highlight> $highlights
 * @property-read Collection<int, DocumentVersion> $versions
 * @property-read Collection<int, DownloadGrant> $downloadGrants
 * @property-read Collection<int, DownloadEvent> $downloadEvents
 */
class Document extends Model
{
    public const RESEARCH_STUDY = 'research_study';

    public const TERMINAL_REPORT = 'terminal_report';

    public const PROJECT_ACCOMPLISHMENT_REPORT = 'project_accomplishment_report';

    protected $fillable = [
        'agency_id',
        'uploaded_by',
        'document_type',
        'title',
        'description',
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
        'status',
        'year',
        'reporting_quarter',
        'category',
        'access_mode',
        'embargo_until',
        'external_url',
        'owner_name',
        'owner_email',
        'notify_access_requests',
        'notify_research_inquiries',
        'send_copy_to_agency_admin',
        'is_ai_tagged',
        'completion_score',
        'digital_library_score',
        'download_count',
        'submitted_at',
        'published_at',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
        'pre_archive_status',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'embargo_until' => 'date',
            'notify_access_requests' => 'boolean',
            'notify_research_inquiries' => 'boolean',
            'send_copy_to_agency_admin' => 'boolean',
            'is_ai_tagged' => 'boolean',
            'submitted_at' => 'datetime',
            'published_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function metadata(): HasOne
    {
        return $this->hasOne(DocumentMetadata::class);
    }

    public function publicFields(): HasMany
    {
        return $this->hasMany(PublicMetadataField::class);
    }

    public function sdgTags(): BelongsToMany
    {
        return $this->belongsToMany(SdgTag::class, 'document_sdg')->withPivot(['source', 'confidence'])->withTimestamps();
    }

    public function accessRequests(): HasMany
    {
        return $this->hasMany(AccessRequest::class);
    }

    public function performanceRows(): HasMany
    {
        return $this->hasMany(ReportPerformanceRow::class);
    }

    public function financial(): HasOne
    {
        return $this->hasOne(ReportFinancial::class);
    }

    public function papClassifications(): HasMany
    {
        return $this->hasMany(PapClassification::class);
    }

    public function highlights(): HasMany
    {
        return $this->hasMany(Highlight::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(DocumentVersion::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function downloadGrants(): HasMany
    {
        return $this->hasMany(DownloadGrant::class);
    }

    public function downloadEvents(): HasMany
    {
        return $this->hasMany(DownloadEvent::class);
    }

    public function isResearchStudy(): bool
    {
        return $this->document_type === self::RESEARCH_STUDY;
    }

    public function usesReportFlow(): bool
    {
        return in_array($this->document_type, [self::TERMINAL_REPORT, self::PROJECT_ACCOMPLISHMENT_REPORT], true);
    }

    public function documentTypeLabel(): string
    {
        return match ($this->document_type) {
            self::TERMINAL_REPORT => 'Terminal Report',
            self::PROJECT_ACCOMPLISHMENT_REPORT => 'Project Accomplishment Report',
            default => 'Research Study',
        };
    }

    public function statusLabel(): string
    {
        return str($this->status)->replace('_', ' ')->title()->toString();
    }

    public function accessModeLabel(): string
    {
        return match ($this->access_mode) {
            'request_access' => 'Request Access',
            'restricted_admin' => 'Restricted (Admin Only)',
            'embargo_until_date' => 'Embargo Until Date',
            'external_link_only' => 'External Link Only',
            default => 'Public Download',
        };
    }

    public function publicFieldNames(): array
    {
        return $this->publicFields()
            ->where('is_public', true)
            ->pluck('field_name')
            ->all();
    }
}
