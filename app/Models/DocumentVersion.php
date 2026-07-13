<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $document_id
 * @property int $version_number
 * @property array<string, mixed> $snapshot
 * @property string|null $file_path
 * @property string|null $original_filename
 * @property string|null $mime_type
 * @property int|null $file_size
 * @property string|null $change_summary
 * @property int|null $created_by
 * @property Carbon|null $restored_at
 * @property Carbon $created_at
 * @property-read Document $document
 * @property-read User|null $creator
 */
class DocumentVersion extends Model
{
    protected $fillable = [
        'document_id', 'version_number', 'snapshot', 'file_path', 'original_filename',
        'mime_type', 'file_size', 'change_summary', 'created_by', 'restored_at',
    ];

    protected function casts(): array
    {
        return ['snapshot' => 'array', 'restored_at' => 'datetime'];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
