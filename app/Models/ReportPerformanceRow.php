<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportPerformanceRow extends Model
{
    protected $fillable = [
        'document_id',
        'activity_output_indicator',
        'target',
        'actual',
        'accomplishment_percentage',
        'status',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
