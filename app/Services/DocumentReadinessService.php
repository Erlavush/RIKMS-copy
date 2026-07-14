<?php

namespace App\Services;

use App\Models\Document;

class DocumentReadinessService
{
    public function stepCount(Document|string|null $documentOrType): int
    {
        $type = $documentOrType instanceof Document ? $documentOrType->document_type : $documentOrType;

        return in_array($type, ['terminal_report', 'project_accomplishment_report'], true) ? 9 : 6;
    }

    public function steps(Document|string|null $documentOrType): array
    {
        if ($this->stepCount($documentOrType) === 9) {
            return [
                1 => 'Doc Type',
                2 => 'Details',
                3 => 'Metadata Draft',
                4 => 'Performance',
                5 => 'PAP',
                6 => 'Financials',
                7 => 'Highlights',
                8 => 'SDG',
                9 => 'Review',
            ];
        }

        return [
            1 => 'Doc Type',
            2 => 'Upload',
            3 => 'Metadata Draft',
            4 => 'SDG Tagging',
            5 => 'Access',
            6 => 'Review',
        ];
    }

    public function score(Document $document, int $currentStep): int
    {
        $total = $this->stepCount($document);

        return min($total, max(1, $currentStep));
    }

    public function completionScore(Document $document): int
    {
        $score = 0;
        $score += ($document->file_path || ($document->access_mode === 'external_link_only' && $document->external_url)) ? 20 : 0;
        $score += $document->metadata ? 25 : 0;
        $score += $document->sdgTags->count() > 0 ? 20 : 0;
        $score += $document->access_mode ? 15 : 0;
        $score += $document->submitted_at ? 20 : 0;

        return min(100, $score);
    }

    public function publicMetadataCount(Document $document): int
    {
        return $document->publicFields->where('is_public', true)->count();
    }
}
