<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $security_scan_id
 * @property string $fingerprint
 * @property string|null $external_id
 * @property string $title
 * @property string|null $description
 * @property string $severity
 * @property string|null $confidence
 * @property string $status
 * @property string|null $owasp_category
 * @property string|null $cwe
 * @property string|null $http_method
 * @property string|null $endpoint
 * @property string|null $evidence_summary
 * @property string|null $remediation
 * @property Carbon|null $first_seen_at
 * @property Carbon|null $last_seen_at
 * @property Carbon|null $retested_at
 * @property-read SecurityScan $scan
 */
class SecurityFinding extends Model
{
    protected $fillable = [
        'security_scan_id', 'fingerprint', 'external_id', 'title', 'description',
        'severity', 'confidence', 'status', 'owasp_category', 'cwe', 'http_method',
        'endpoint', 'evidence_summary', 'remediation', 'first_seen_at',
        'last_seen_at', 'retested_at',
    ];

    protected function casts(): array
    {
        return [
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'retested_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<SecurityScan, $this> */
    public function scan(): BelongsTo
    {
        return $this->belongsTo(SecurityScan::class, 'security_scan_id');
    }
}
