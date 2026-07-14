<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $document_id
 * @property int|null $access_request_id
 * @property int|null $user_id
 * @property string|null $email
 * @property string $token_hash
 * @property Carbon $expires_at
 * @property int $max_downloads
 * @property int $download_count
 * @property Carbon|null $revoked_at
 * @property-read Document $document
 * @property-read AccessRequest|null $accessRequest
 */
class DownloadGrant extends Model
{
    protected $fillable = [
        'document_id', 'access_request_id', 'user_id', 'email', 'token_hash',
        'expires_at', 'max_downloads', 'download_count', 'revoked_at', 'created_by',
    ];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'revoked_at' => 'datetime'];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function accessRequest(): BelongsTo
    {
        return $this->belongsTo(AccessRequest::class);
    }

    public function isUsable(): bool
    {
        return $this->revoked_at === null
            && $this->expires_at->isFuture()
            && $this->download_count < $this->max_downloads;
    }
}
