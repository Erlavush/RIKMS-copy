<?php

namespace App\Services;

use InvalidArgumentException;
use Symfony\Component\Process\Process;

class LocalExtractorProcessRunner
{
    /** @param non-empty-list<string> $command */
    public function run(array $command, int $timeoutSeconds): bool
    {
        foreach ($command as $argument) {
            if ($argument === '' || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $argument)) {
                throw new InvalidArgumentException('Local extractor command arguments must be non-empty printable strings.');
            }
        }

        $timeout = max(1, min(600, $timeoutSeconds));
        $process = new Process($command);
        $process->setTimeout($timeout);
        $process->setIdleTimeout($timeout);
        $process->disableOutput();
        $process->run();

        return $process->isSuccessful();
    }
}
