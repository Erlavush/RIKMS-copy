<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentChunk extends Model
{
    protected $fillable = [
        'document_id',
        'chunk_index',
        'content',
        'word_count',
    ];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }
}
