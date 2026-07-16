<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $provider
 * @property string $scan_mode
 * @property string $target_environment
 * @property string $target_url
 * @property string|null $revision
 * @property string $status
 * @property string $report_sha256
 * @property string|null $report_disk
 * @property string|null $report_path
 * @property array<string, mixed>|null $summary
 * @property string|null $failure_reason
 * @property int|null $imported_by
 * @property Carbon|null $started_at
 * @property Carbon|null $completed_at
 * @property Carbon $created_at
 * @property int|null $findings_count
 * @property-read Collection<int, SecurityFinding> $findings
 */
class SecurityScan extends Model
{
    protected $fillable = [
        'provider', 'scan_mode', 'target_environment', 'target_url', 'revision',
        'status', 'report_sha256', 'report_disk', 'report_path', 'summary',
        'failure_reason', 'imported_by', 'started_at', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'summary' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /** @return HasMany<SecurityFinding, $this> */
    public function findings(): HasMany
    {
        return $this->hasMany(SecurityFinding::class);
    }

    /** @return BelongsTo<User, $this> */
    public function importer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }
}
