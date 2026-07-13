<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $document_id
 * @property int|null $requester_id
 * @property string|null $requester_name
 * @property string|null $requester_email
 * @property string|null $requester_organization
 * @property string|null $message
 * @property string $status
 * @property string|null $decision_reason
 * @property Carbon|null $approved_at
 * @property Carbon|null $rejected_at
 * @property Carbon|null $decided_at
 * @property Carbon $created_at
 * @property-read Document $document
 * @property-read User|null $requester
 * @property-read User|null $approver
 * @property-read User|null $decisionMaker
 * @property-read DownloadGrant|null $grant
 */
class AccessRequest extends Model
{
    protected $fillable = [
        'document_id',
        'requester_id',
        'requester_name',
        'requester_email',
        'requester_organization',
        'message',
        'status',
        'decision_reason',
        'approved_by',
        'decided_by',
        'approved_at',
        'rejected_at',
        'decided_at',
    ];

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'decided_at' => 'datetime',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function decisionMaker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }

    public function grant(): HasOne
    {
        return $this->hasOne(DownloadGrant::class);
    }

    public function grants(): HasMany
    {
        return $this->hasMany(DownloadGrant::class);
    }
}
