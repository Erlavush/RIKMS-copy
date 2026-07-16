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
        'provider' => env('RIKMS_AI_PROVIDER', 'vertex'),
        'project_id' => env('GOOGLE_CLOUD_PROJECT'),
        'location' => env('VERTEX_AI_LOCATION', 'global'),
        'model' => env('RIKMS_AI_MODEL', env('VERTEX_AI_MODEL', 'gemini-3.1-flash-lite')),
        'prompt_version' => env('RIKMS_AI_PROMPT_VERSION', 'rikms-metadata-v1'),
        'timeout_seconds' => (int) env('RIKMS_AI_TIMEOUT_SECONDS', 100),
        'max_text_characters' => (int) env('RIKMS_AI_MAX_TEXT_CHARACTERS', 600000),
        'minimum_embedded_text_characters' => (int) env('RIKMS_AI_MIN_EMBEDDED_TEXT_CHARACTERS', 500),
        'local_pdf_text_command' => env('LOCAL_PDF_TEXT_COMMAND'),
        'local_pdf_render_command' => env('LOCAL_PDF_RENDER_COMMAND'),
        'local_ocr_command' => env('LOCAL_OCR_COMMAND'),
        'local_ocr_language' => env('LOCAL_OCR_LANGUAGE', 'eng'),
        'local_ocr_max_pages' => (int) env('LOCAL_OCR_MAX_PAGES', 20),
        'local_ocr_dpi' => (int) env('LOCAL_OCR_DPI', 180),
        'local_ocr_page_timeout_seconds' => (int) env('LOCAL_OCR_PAGE_TIMEOUT_SECONDS', 15),
        'documents_gcs_bucket' => env('DOCUMENTS_GCS_BUCKET'),
        'document_ai' => [
            'processor_id' => env('DOCUMENT_AI_PROCESSOR_ID'),
            'location' => env('DOCUMENT_AI_LOCATION', 'us'),
        ],
        'ollama' => [
            'base_url' => env('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
            'model' => env('OLLAMA_MODEL', 'qwen3.5:4b'),
            'num_ctx' => (int) env('OLLAMA_NUM_CTX', 8192),
            'max_input_characters' => (int) env('OLLAMA_MAX_INPUT_CHARACTERS', 24000),
            'keep_alive' => env('OLLAMA_KEEP_ALIVE', '30m'),
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
