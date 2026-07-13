<?php

namespace App\Services;

use App\Models\Document;

class AiMetadataExtractionService
{
    public function analyze(Document $document): array
    {
        $document->loadMissing(['metadata', 'sdgTags']);
        $metadata = $document->metadata;
        $filenameTitle = $document->original_filename
            ? pathinfo($document->original_filename, PATHINFO_FILENAME)
            : null;

        return [
            'title' => $metadata?->title ?: $document->title ?: $filenameTitle,
            'abstract' => $metadata?->abstract ?: $document->description,
            'methodology' => $metadata?->methodology,
            'review_of_related_literature' => $metadata?->review_of_related_literature,
            'theoretical_framework' => $metadata?->theoretical_framework,
            'results_and_discussion' => $metadata?->results_and_discussion,
            'keywords' => $metadata->keywords ?? [],
            'authors' => $metadata->authors ?? [],
            'doi' => $metadata?->doi,
            'suggested_sdgs' => $document->sdgTags->map(fn ($tag) => [
                'sdg' => $tag->number,
                'reason' => 'Existing agency-selected classification retained for human review.',
                'confidence' => null,
            ])->values()->all(),
            'pap_suggestions' => [],
            'financials' => null,
            'performance_rows' => [],
            'mocked' => true,
        ];
    }
}
