<?php

namespace App\Services;

use App\Models\SecurityFinding;
use App\Models\SecurityScan;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use JsonException;

/**
 * @phpstan-type FindingAttributes array{
 *     fingerprint: string,
 *     external_id: string|null,
 *     title: string,
 *     description: string,
 *     severity: string,
 *     confidence: string|null,
 *     status: string,
 *     owasp_category: string|null,
 *     cwe: string|null,
 *     http_method: string|null,
 *     endpoint: string|null,
 *     evidence_summary: string,
 *     remediation: string
 * }
 */
class SecurityReportImporter
{
    /**
     * @param array{provider?: string, scan_mode?: string, target_environment?: string, target_url?: string,
     *     revision?: string|null, report_disk?: string|null, report_path?: string|null, imported_by?: int|null} $context
     *
     * @throws JsonException
     */
    public function import(string $contents, string $format, array $context = []): SecurityScan
    {
        $decoded = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
        if (! is_array($decoded)) {
            throw new InvalidArgumentException('Security report must contain a JSON object.');
        }

        $format = $format === 'auto' ? $this->detectFormat($decoded) : $format;
        $findings = match ($format) {
            'zap' => $this->zapFindings($decoded),
            'rikms-native' => $this->nativeFindings($decoded),
            default => throw new InvalidArgumentException("Unsupported security report format: {$format}"),
        };

        $hash = hash('sha256', $contents);
        $existing = SecurityScan::query()->where('report_sha256', $hash)->first();
        if ($existing) {
            return $existing->load('findings');
        }

        $target = $this->targetUrl($context['target_url'] ?? null, $decoded);
        $provider = $this->safeToken($context['provider'] ?? $format, 32, 'provider');
        $scanMode = $this->safeToken($context['scan_mode'] ?? (is_string($decoded['mode'] ?? null) ? $decoded['mode'] : 'passive'), 24, 'scan mode');
        $environment = $this->safeToken($context['target_environment'] ?? 'local', 32, 'target environment');
        $completedAt = now();
        $summary = $this->summary($findings);

        return DB::transaction(function () use (
            $provider, $scanMode, $environment, $target, $context, $hash, $summary, $findings, $completedAt,
        ): SecurityScan {
            $scan = SecurityScan::query()->create([
                'provider' => $provider,
                'scan_mode' => $scanMode,
                'target_environment' => $environment,
                'target_url' => $target,
                'revision' => $this->nullableText($context['revision'] ?? null, 64),
                'status' => 'completed',
                'report_sha256' => $hash,
                'report_disk' => $this->nullableText($context['report_disk'] ?? null, 64),
                'report_path' => $this->nullableText($context['report_path'] ?? null, 2048),
                'summary' => $summary,
                'imported_by' => $context['imported_by'] ?? null,
                'completed_at' => $completedAt,
            ]);

            foreach ($findings as $finding) {
                $this->storeFinding($scan, $finding, $completedAt);
            }

            return $scan->load('findings');
        });
    }

    /** @param array<string, mixed> $report */
    private function detectFormat(array $report): string
    {
        if (isset($report['site']) || isset($report['@programName'])) {
            return 'zap';
        }
        if (isset($report['findings'])) {
            return 'rikms-native';
        }

        throw new InvalidArgumentException('Unable to detect security report format.');
    }

    /** @param array<string, mixed> $report @return list<FindingAttributes> */
    private function zapFindings(array $report): array
    {
        $findings = [];
        foreach (Arr::wrap($report['site'] ?? []) as $site) {
            if (! is_array($site)) {
                continue;
            }
            foreach (Arr::wrap($site['alerts'] ?? []) as $alert) {
                if (! is_array($alert)) {
                    continue;
                }
                $instances = array_values(array_filter(Arr::wrap($alert['instances'] ?? []), 'is_array'));
                $instance = $instances[0] ?? [];
                $title = $this->cleanText($alert['name'] ?? $alert['alert'] ?? 'ZAP observation', 255);
                $endpoint = $this->safeEndpoint($instance['uri'] ?? null);
                $externalId = $this->nullableText($alert['pluginid'] ?? $alert['alertRef'] ?? null, 128);
                $method = $this->nullableText($instance['method'] ?? null, 16);
                $parameter = $this->cleanText($instance['param'] ?? '', 255);
                $fingerprint = hash('sha256', implode('|', [$externalId, $title, $method, $endpoint, $parameter]));

                $evidenceParts = array_filter([
                    $method ? 'Method: '.strtoupper($method) : null,
                    $endpoint ? 'Endpoint: '.$endpoint : null,
                    $parameter !== '' ? 'Parameter: '.$parameter : null,
                    count($instances) > 1 ? 'Observed instances: '.count($instances) : null,
                ]);

                $findings[$fingerprint] = [
                    'fingerprint' => $fingerprint,
                    'external_id' => $externalId,
                    'title' => $title,
                    'description' => $this->cleanText($alert['desc'] ?? null, 8000, true),
                    'severity' => $this->severity($alert['riskdesc'] ?? $alert['riskcode'] ?? 'info'),
                    'confidence' => $this->nullableText($alert['confidence'] ?? null, 24),
                    'status' => 'observation',
                    'owasp_category' => null,
                    'cwe' => $this->cwe($alert['cweid'] ?? null),
                    'http_method' => $method ? strtoupper($method) : null,
                    'endpoint' => $endpoint,
                    'evidence_summary' => implode('; ', $evidenceParts),
                    'remediation' => $this->cleanText($alert['solution'] ?? null, 8000, true),
                ];
            }
        }

        return array_values($findings);
    }

    /** @param array<string, mixed> $report @return list<FindingAttributes> */
    private function nativeFindings(array $report): array
    {
        $findings = [];
        foreach (Arr::wrap($report['findings'] ?? []) as $item) {
            if (! is_array($item)) {
                continue;
            }
            $title = $this->cleanText($item['title'] ?? $item['name'] ?? 'Native security observation', 255);
            $externalId = $this->nullableText($item['id'] ?? null, 128);
            $method = $this->nullableText($item['method'] ?? null, 16);
            $endpoint = $this->safeEndpoint($item['endpoint'] ?? null);
            $fingerprint = hash('sha256', implode('|', [$externalId, $title, $method, $endpoint]));
            $findings[$fingerprint] = [
                'fingerprint' => $fingerprint,
                'external_id' => $externalId,
                'title' => $title,
                'description' => $this->cleanText($item['description'] ?? null, 8000, true),
                'severity' => $this->severity($item['severity'] ?? 'info'),
                'confidence' => $this->nullableText($item['confidence'] ?? null, 24),
                'status' => 'observation',
                'owasp_category' => $this->nullableText($item['owasp'] ?? null, 64),
                'cwe' => $this->cwe($item['cwe'] ?? null),
                'http_method' => $method ? strtoupper($method) : null,
                'endpoint' => $endpoint,
                'evidence_summary' => $this->cleanText($item['observed'] ?? null, 2000, true),
                'remediation' => $this->cleanText($item['remediation'] ?? null, 8000, true),
            ];
        }

        return array_values($findings);
    }

    /** @param list<FindingAttributes> $findings @return array<string, int> */
    private function summary(array $findings): array
    {
        $summary = ['total' => count($findings), 'critical' => 0, 'high' => 0, 'medium' => 0, 'low' => 0, 'info' => 0];
        foreach ($findings as $finding) {
            $severity = $finding['severity'];
            $summary[$severity] = ($summary[$severity] ?? 0) + 1;
        }

        return $summary;
    }

    /** @param FindingAttributes $finding */
    private function storeFinding(SecurityScan $scan, array $finding, Carbon $completedAt): void
    {
        $record = new SecurityFinding;
        $record->fingerprint = $finding['fingerprint'];
        $record->external_id = $finding['external_id'];
        $record->title = $finding['title'];
        $record->description = $finding['description'];
        $record->severity = $finding['severity'];
        $record->confidence = $finding['confidence'];
        $record->status = $finding['status'];
        $record->owasp_category = $finding['owasp_category'];
        $record->cwe = $finding['cwe'];
        $record->http_method = $finding['http_method'];
        $record->endpoint = $finding['endpoint'];
        $record->evidence_summary = $finding['evidence_summary'];
        $record->remediation = $finding['remediation'];
        $record->first_seen_at = $completedAt;
        $record->last_seen_at = $completedAt;
        $scan->findings()->save($record);
    }

    /** @param array<string, mixed> $report */
    private function targetUrl(?string $requested, array $report): string
    {
        $site = Arr::wrap($report['site'] ?? [])[0] ?? [];
        $target = $requested ?: ($report['target'] ?? null)
            ?: (is_array($site) ? ($site['@name'] ?? null) : null)
            ?: 'unknown://not-recorded';
        $target = $this->cleanText($target, 2048);
        if ($target === 'unknown://not-recorded') {
            return $target;
        }
        $target = $this->safeEndpoint($target);
        if ($target === null || ! filter_var($target, FILTER_VALIDATE_URL)) {
            throw new InvalidArgumentException('Security report target URL is invalid.');
        }

        return $target;
    }

    private function severity(mixed $value): string
    {
        $value = strtolower((string) $value);
        foreach (['critical', 'high', 'medium', 'low'] as $severity) {
            if (str_contains($value, $severity)) {
                return $severity;
            }
        }

        return 'info';
    }

    private function cwe(mixed $value): ?string
    {
        $value = preg_replace('/[^0-9]/', '', (string) $value) ?? '';

        return $value === '' || $value === '0' || $value === '-1' ? null : 'CWE-'.$value;
    }

    private function safeEndpoint(mixed $value): ?string
    {
        $endpoint = $this->cleanText($value, 2048);
        if ($endpoint === '') {
            return null;
        }
        $parts = parse_url($endpoint);
        if (! is_array($parts)) {
            return null;
        }

        if (str_starts_with($endpoint, '/') && ! str_starts_with($endpoint, '//')) {
            return $parts['path'] ?? '/';
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = strtolower((string) ($parts['host'] ?? ''));
        if (! in_array($scheme, ['http', 'https'], true) || $host === '') {
            return null;
        }

        $safe = $scheme.'://'.$host;
        if (isset($parts['port'])) {
            $safe .= ':'.$parts['port'];
        }

        return $safe.($parts['path'] ?? '/');
    }

    private function safeToken(string $value, int $limit, string $label): string
    {
        $value = strtolower(trim($value));
        if ($value === '' || ! preg_match('/^[a-z0-9_-]+$/', $value)) {
            throw new InvalidArgumentException("Invalid {$label}.");
        }

        return Str::limit($value, $limit, '');
    }

    private function nullableText(mixed $value, int $limit): ?string
    {
        $text = $this->cleanText($value, $limit);

        return $text === '' ? null : $text;
    }

    private function cleanText(mixed $value, int $limit, bool $stripHtml = false): string
    {
        $text = is_scalar($value) ? (string) $value : '';
        if ($stripHtml) {
            $text = strip_tags($text);
        }
        $text = str_replace("\0", '', $text);
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;
        $text = preg_replace('/(?i)authorization\s*[:=]\s*[^\s;]+(?:\s+[^\s;]+)?/', 'Authorization: [REDACTED]', $text) ?? $text;
        $text = preg_replace('/(?i)(cookie|set-cookie|x-xsrf-token|password|token)\s*[:=]\s*[^\s;]+/', '$1: [REDACTED]', $text) ?? $text;

        return Str::limit(trim($text), $limit, '…');
    }
}
