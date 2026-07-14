<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** @property int $id @property string|null $title @property string|null $description @property bool $is_featured */
class Highlight extends Model
{
    protected $fillable = ['document_id', 'title', 'description', 'file_path', 'is_featured'];

    protected function casts(): array
    {
        return ['is_featured' => 'boolean'];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
