<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $document_id
 * @property Carbon $created_at
 * @property-read Document $document
 */
class DownloadEvent extends Model
{
    protected $fillable = [
        'document_id', 'user_id', 'download_grant_id', 'email', 'ip_address', 'user_agent',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
