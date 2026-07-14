<?php

namespace App\Console\Commands;

use App\Models\Document;
use App\Support\DocumentStorage;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class PurgeRikmsDemoData extends Command
{
    protected $signature = 'rikms:purge-demo-data
        {--execute : Delete only the positively identified seeded paper records}
        {--backup-reference= : Required evidence of a completed backup in production}';

    protected $description = 'Preview or remove the original RIKMS seeded paper fixtures without matching user uploads';

    private const SEEDED_TITLES = [
        'Cybersecurity data science: an overview from machine learning perspective',
        'Changes-in-thyroid-function-of-nesting-tree-swallowS--Tachycin_2019_Environ',
        'NEAR-REALTIME TRACKING USING GIS AND THERMAL SENSING TECHNOLOGY FOR Foc TR4 DETECTION AND PREDICTION DISPERSAL IN BANANA',
        'TERMINAL-REPORT_FocTR4_GIS-ThermalSensing-Project-Accomplishment',
    ];

    public function handle(): int
    {
        $query = $this->demoDocuments();
        $count = (clone $query)->count();
        $this->components->info("Identified {$count} seeded paper record(s). User-created titles are not matched.");

        if (! $this->option('execute')) {
            $this->line('Dry run only. Re-run with --execute after reviewing the count.');

            return self::SUCCESS;
        }
        if (app()->environment('production') && trim((string) $this->option('backup-reference')) === '') {
            throw new RuntimeException('Production purge requires --backup-reference for a completed Cloud SQL backup.');
        }

        $paths = (clone $query)->whereNotNull('file_path')->pluck('file_path')->filter()->unique()->values();
        DB::transaction(fn () => $this->demoDocuments()->delete());

        foreach ($paths as $path) {
            if (Document::query()->where('file_path', $path)->doesntExist()) {
                Storage::disk(DocumentStorage::disk())->delete($path);
            }
        }

        $this->components->info("Deleted {$count} seeded paper record(s); shared source files were removed only when no document still referenced them.");

        return self::SUCCESS;
    }

    /** @return Builder<Document> */
    private function demoDocuments(): Builder
    {
        return Document::query()->where(function (Builder $query): void {
            $query->whereIn('title', self::SEEDED_TITLES)
                ->orWhere('title', 'like', 'Regional Innovation Knowledge Asset %')
                ->orWhere('original_filename', 'rikms-demo-research.pdf');
        });
    }
}
