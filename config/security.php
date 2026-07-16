<?php

return [
    'reports_disk' => env('SECURITY_REPORTS_DISK', 'security-reports'),
    'reports_root' => trim((string) env('SECURITY_REPORTS_PREFIX', 'reports'), '/'),
    'max_report_bytes' => (int) env('SECURITY_MAX_REPORT_BYTES', 20 * 1024 * 1024),
    'allowed_targets' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('SECURITY_ALLOWED_TARGETS', 'http://127.0.0.1:8000,http://localhost:8000')),
    ))),
    'production_host' => env('SECURITY_PRODUCTION_HOST', 'rikms.v3ra.net'),
    'active_scan_enabled' => (bool) env('SECURITY_ACTIVE_SCAN_ENABLED', false),
];
