<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $document_id
 * @property int|null $requested_by
 * @property int|null $reviewed_by
 * @property string $status
 * @property string $model
 * @property string $prompt_version
 * @property string $source_hash
 * @property string|null $extraction_method
 * @property array<string, mixed>|null $suggestions
 * @property array<int, string>|null $accepted_fields
 * @property float|null $confidence
 * @property int|null $input_tokens
 * @property int|null $output_tokens
 * @property int|null $reasoning_tokens
 * @property float|null $estimated_cost_usd
 * @property string|null $error_code
 * @property string|null $error_message
 * @property CarbonInterface|null $started_at
 * @property CarbonInterface|null $completed_at
 * @property CarbonInterface|null $reviewed_at
 * @property CarbonInterface $created_at
 * @property CarbonInterface $updated_at
 * @property-read Document $document
 * @property-read User|null $requester
 * @property-read User|null $reviewer
 */
class DocumentAiAnalysis extends Model
{
    protected $fillable = [
        'document_id', 'requested_by', 'reviewed_by', 'status', 'model', 'prompt_version',
        'source_hash', 'extraction_method', 'suggestions', 'accepted_fields', 'confidence',
        'input_tokens', 'output_tokens', 'reasoning_tokens', 'estimated_cost_usd',
        'error_code', 'error_message', 'started_at', 'completed_at', 'reviewed_at',
        'ocr_duration', 'model_duration',
    ];

    protected function casts(): array
    {
        return [
            'suggestions' => 'array',
            'accepted_fields' => 'array',
            'confidence' => 'float',
            'estimated_cost_usd' => 'float',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'ocr_duration' => 'integer',
            'model_duration' => 'integer',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
