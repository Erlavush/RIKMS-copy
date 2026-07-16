<?php

namespace App\Contracts;

interface LocalDocumentTextExtractor
{
    public function key(): string;

    public function configured(): bool;

    /** @return array{method: string, text: string}|null */
    public function extract(string $pdfPath): ?array;
}
