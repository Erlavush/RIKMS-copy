<?php

namespace App\Support;

final class DocumentStorage
{
    public static function disk(): string
    {
        return (string) config('rikms.documents_disk', 'documents');
    }
}
