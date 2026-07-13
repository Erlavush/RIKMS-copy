<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PapClassification extends Model
{
    protected $fillable = [
        'document_id',
        'category',
        'description',
        'beneficiary_government',
        'beneficiary_academe',
        'beneficiary_business',
        'beneficiary_civil_society',
        'beneficiary_media',
    ];

    protected function casts(): array
    {
        return [
            'beneficiary_government' => 'boolean',
            'beneficiary_academe' => 'boolean',
            'beneficiary_business' => 'boolean',
            'beneficiary_civil_society' => 'boolean',
            'beneficiary_media' => 'boolean',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
