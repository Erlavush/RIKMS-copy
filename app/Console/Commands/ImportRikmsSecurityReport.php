<?php

namespace App\Console\Commands;

use App\Services\SecurityReportImporter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ImportRikmsSecurityReport extends Command
{
    protected $signature = 'rikms:security-import
        {path : Path to a JSON report}
        {--format=auto : auto, zap, or rikms-native}
        {--provider= : Scanner provider label}
        {--target= : Exact tested target URL}
        {--environment=local : local, staging, or production}
        {--revision= : Tested Git or Cloud Run revision}
        {--mode=passive : passive, active, or manual}';

    protected $description = 'Import a sanitized security report into the private administrator dashboard';

    public function handle(SecurityReportImporter $importer): int
    {
        $path = (string) $this->argument('path');
        $realPath = realpath($path);
        if ($realPath === false || ! is_file($realPath) || ! is_readable($realPath)) {
            $this->components->error('The report path is not a readable file.');

            return self::FAILURE;
        }

        $size = filesize($realPath);
        if ($size === false || $size > (int) config('security.max_report_bytes')) {
            $this->components->error('The report exceeds the configured private import limit.');

            return self::FAILURE;
        }

        $contents = file_get_contents($realPath);
        if ($contents === false) {
            $this->components->error('The report could not be read.');

            return self::FAILURE;
        }

        $disk = (string) config('security.reports_disk');
        $reportPath = trim((string) config('security.reports_root'), '/').'/'.now()->format('Y/m/d').'/'.hash('sha256', $contents).'.json';

        try {
            Storage::disk($disk)->put($reportPath, $contents, ['visibility' => 'private']);
            $scan = $importer->import($contents, (string) $this->option('format'), [
                'provider' => $this->option('provider') ?: null,
                'target_url' => $this->option('target') ?: null,
                'target_environment' => (string) $this->option('environment'),
                'revision' => $this->option('revision') ?: null,
                'scan_mode' => (string) $this->option('mode'),
                'report_disk' => $disk,
                'report_path' => $reportPath,
            ]);
        } catch (Throwable $exception) {
            Storage::disk($disk)->delete($reportPath);
            $this->components->error('Security report import failed: '.$exception->getMessage());

            return self::FAILURE;
        }

        $this->components->info("Imported scan {$scan->id} with {$scan->findings->count()} sanitized observations.");

        return self::SUCCESS;
    }
}
