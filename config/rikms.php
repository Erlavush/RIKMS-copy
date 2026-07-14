<?php

return [
    /*
    | Research files are intentionally isolated from Laravel's general-purpose
    | local disk. In Cloud Run, DOCUMENTS_ROOT points to the private GCS volume.
    */
    'documents_disk' => env('DOCUMENTS_DISK', 'documents'),

    /* Keep uploads below Cloud Run's HTTP/1 request ceiling, including form overhead. */
    'max_document_upload_kb' => (int) env('RIKMS_MAX_DOCUMENT_UPLOAD_KB', 25 * 1024),
    'max_highlight_upload_kb' => (int) env('RIKMS_MAX_HIGHLIGHT_UPLOAD_KB', 10 * 1024),
];
