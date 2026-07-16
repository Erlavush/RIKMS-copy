<?php

namespace App\Console\Commands;

use App\Services\SecurityReportImporter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ImportPendingRikmsSecurityReports extends Command
{
    protected $signature = 'rikms:security-import-pending {--limit=20 : Maximum reports to import in one run}';

    protected $description = 'Import pending private GCS security reports into normalized administrator findings';

    public function handle(SecurityReportImporter $importer): int
    {
        $diskName = (string) config('security.reports_disk');
        $disk = Storage::disk($diskName);
        $files = collect($disk->allFiles('incoming'))
            ->filter(fn (string $path): bool => str_ends_with(strtolower($path), '.json'))
            ->sort()->take(max(1, min((int) $this->option('limit'), 100)));
        $imported = 0;
        $failed = 0;

        foreach ($files as $path) {
            try {
                $contents = $disk->get($path);
                if (strlen($contents) > (int) config('security.max_report_bytes')) {
                    throw new \RuntimeException('Report exceeds the configured import limit.');
                }
                [$environment, $revision, $provider] = $this->pathContext($path);
                $scan = $importer->import($contents, 'auto', [
                    'provider' => $provider,
                    'target_environment' => $environment,
                    'revision' => $revision,
                    'report_disk' => $diskName,
                    'report_path' => $path,
                ]);
                $processedPath = 'processed/'.now()->format('Y/m/d').'/'.hash('sha256', $path).'-'.basename($path);
                $disk->move($path, $processedPath);
                $scan->update(['report_path' => $processedPath]);
                $imported++;
            } catch (Throwable $exception) {
                $failed++;
                $failedPath = 'failed/'.now()->format('Y/m/d').'/'.hash('sha256', $path).'-'.basename($path);
                try {
                    $disk->move($path, $failedPath);
                } catch (Throwable) {
                    // Leave the original object in place when quarantine itself fails.
                }
                Log::warning('Private security report import failed.', [
                    'report_sha256' => hash('sha256', $path),
                    'exception_class' => $exception::class,
                ]);
            }
        }

        $this->components->info("Security reports imported: {$imported}; quarantined: {$failed}.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    /** @return array{0: string, 1: string|null, 2: string} */
    private function pathContext(string $path): array
    {
        $parts = explode('/', $path);
        $environment = $parts[1] ?? 'staging';
        if (! in_array($environment, ['local', 'staging', 'production'], true)) {
            $environment = 'staging';
        }
        $revision = isset($parts[2]) && $parts[2] !== 'unknown' ? substr($parts[2], 0, 64) : null;
        $provider = strtolower(strtok(pathinfo($path, PATHINFO_FILENAME), '-') ?: '');
        $provider = (string) preg_replace('/[^a-z0-9_]/', '', $provider);
        if ($provider === '') {
            $provider = 'automated';
        }

        return [$environment, $revision, substr($provider, 0, 32)];
    }
}
