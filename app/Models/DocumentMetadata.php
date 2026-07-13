<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $document_id
 * @property string|null $title
 * @property string|null $abstract
 * @property string|null $methodology
 * @property string|null $review_of_related_literature
 * @property string|null $theoretical_framework
 * @property string|null $results_and_discussion
 * @property array<int, string>|null $keywords
 * @property array<int, string>|null $authors
 * @property string|null $doi
 * @property float|null $ai_confidence
 * @property array<string, mixed>|null $raw_ai_json
 */
class DocumentMetadata extends Model
{
    protected $table = 'document_metadata';

    protected $fillable = [
        'document_id',
        'title',
        'abstract',
        'methodology',
        'review_of_related_literature',
        'theoretical_framework',
        'results_and_discussion',
        'keywords',
        'authors',
        'doi',
        'ai_confidence',
        'raw_ai_json',
    ];

    protected function casts(): array
    {
        return [
            'keywords' => 'array',
            'authors' => 'array',
            'raw_ai_json' => 'array',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
