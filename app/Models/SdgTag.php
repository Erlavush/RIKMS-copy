<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** @property int $id @property int $number @property string $name @property string $short_name @property string $color */
class SdgTag extends Model
{
    protected $fillable = ['number', 'name', 'short_name', 'color'];

    public function documents(): BelongsToMany
    {
        return $this->belongsToMany(Document::class, 'document_sdg')->withPivot(['source', 'confidence'])->withTimestamps();
    }

    public function label(): string
    {
        return 'SDG '.$this->number;
    }
}
