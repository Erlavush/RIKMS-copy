<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/** @property Carbon|null $financial_as_of_date */
class ReportFinancial extends Model
{
    protected $fillable = [
        'document_id',
        'allotted_budget',
        'released_amount',
        'obligated_amount',
        'utilized_amount',
        'remaining_balance',
        'budget_utilization_percentage',
        'financial_as_of_date',
    ];

    protected function casts(): array
    {
        return ['financial_as_of_date' => 'date'];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
