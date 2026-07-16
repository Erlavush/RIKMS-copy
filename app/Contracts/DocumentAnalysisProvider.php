<?php

namespace App\Contracts;

use App\Models\Document;

interface DocumentAnalysisProvider
{
    /** @return array{suggestions: array<string, mixed>, extraction_method: string, input_tokens: int, output_tokens: int, reasoning_tokens: int, estimated_cost_usd: float} */
    public function analyze(Document $document): array;
}
