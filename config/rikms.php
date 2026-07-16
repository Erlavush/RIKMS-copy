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

    'document_processing' => [
        'auto_queue' => (bool) env('RIKMS_DOCUMENT_PROCESSING_AUTO_QUEUE', true),
    ],

    'ai' => [
        'enabled' => (bool) env('RIKMS_AI_ENABLED', false),
        'auto_queue' => (bool) env('RIKMS_AI_AUTO_QUEUE', true),
        'project_id' => env('GOOGLE_CLOUD_PROJECT'),
        'location' => env('VERTEX_AI_LOCATION', 'global'),
        'model' => env('VERTEX_AI_MODEL', 'gemini-3.1-flash-lite'),
        'prompt_version' => env('RIKMS_AI_PROMPT_VERSION', 'rikms-metadata-v1'),
        'timeout_seconds' => (int) env('RIKMS_AI_TIMEOUT_SECONDS', 100),
        'max_text_characters' => (int) env('RIKMS_AI_MAX_TEXT_CHARACTERS', 600000),
        'minimum_embedded_text_characters' => (int) env('RIKMS_AI_MIN_EMBEDDED_TEXT_CHARACTERS', 500),
        'documents_gcs_bucket' => env('DOCUMENTS_GCS_BUCKET'),
        'document_ai' => [
            'processor_id' => env('DOCUMENT_AI_PROCESSOR_ID'),
            'location' => env('DOCUMENT_AI_LOCATION', 'us'),
        ],
        'pricing' => [
            'input_per_million' => (float) env('VERTEX_AI_INPUT_PRICE_PER_MILLION', 0.25),
            'output_per_million' => (float) env('VERTEX_AI_OUTPUT_PRICE_PER_MILLION', 1.50),
        ],
    ],

    /*
    | Google Drive mirroring is intentionally owned by a separate adapter.
    | Agency folder IDs and OAuth material must never be committed here.
    */
    'drive_sync' => [
        'enabled' => (bool) env('RIKMS_DRIVE_SYNC_ENABLED', false),
    ],
];
