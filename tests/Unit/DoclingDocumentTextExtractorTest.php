<?php

namespace Tests\Unit;

use App\Services\DoclingDocumentTextExtractor;
use App\Services\LocalExtractorProcessRunner;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class DoclingDocumentTextExtractorTest extends TestCase
{
    private string $source;

    protected function setUp(): void
    {
        parent::setUp();

        $this->source = tempnam(sys_get_temp_dir(), 'rikms-docling-source-').'.pdf';
        file_put_contents($this->source, "%PDF-1.4\nsynthetic test document");
        config()->set('rikms.ai.local_extractor.docling.python_command', PHP_BINARY);
        config()->set('rikms.ai.local_extractor.docling.script', base_path('scripts/docling_extract.py'));
        config()->set('rikms.ai.local_extractor.max_pages', 20);
        config()->set('rikms.ai.local_extractor.max_output_bytes', 100000);
        config()->set('rikms.ai.local_extractor.timeout_seconds', 30);
        config()->set('rikms.ai.max_text_characters', 2000);
        config()->set('rikms.ai.minimum_embedded_text_characters', 10);
    }

    protected function tearDown(): void
    {
        @unlink($this->source);
        parent::tearDown();
    }

    public function test_it_uses_argument_arrays_reads_bounded_json_and_cleans_up(): void
    {
        $workingDirectory = null;
        $runner = Mockery::mock(LocalExtractorProcessRunner::class);
        $runner->shouldReceive('run')->once()->withArgs(function (array $command, int $timeout) use (&$workingDirectory): bool {
            $this->assertSame(PHP_BINARY, $command[0]);
            $this->assertSame(base_path('scripts/docling_extract.py'), $command[1]);
            $this->assertSame($this->source, $command[array_search('--input', $command, true) + 1]);
            $this->assertSame(30, $timeout);

            $output = $command[array_search('--output', $command, true) + 1];
            $workingDirectory = dirname($output);
            file_put_contents($output, json_encode([
                'text' => str_repeat('Docling table and layout text. ', 30),
                'page_count' => 2,
            ], JSON_THROW_ON_ERROR));

            return true;
        })->andReturnUsing(fn (): bool => true);

        $result = (new DoclingDocumentTextExtractor($runner))->extract($this->source);

        $this->assertSame('local_docling_markdown', $result['method']);
        $this->assertStringContainsString('Docling table and layout text.', $result['text']);
        $this->assertNotNull($workingDirectory);
        $this->assertDirectoryDoesNotExist($workingDirectory);
    }

    public function test_it_rejects_an_oversized_result_and_still_cleans_up(): void
    {
        config()->set('rikms.ai.local_extractor.max_output_bytes', 4096);
        $workingDirectory = null;
        $runner = Mockery::mock(LocalExtractorProcessRunner::class);
        $runner->shouldReceive('run')->once()->andReturnUsing(function (array $command) use (&$workingDirectory): bool {
            $output = $command[array_search('--output', $command, true) + 1];
            $workingDirectory = dirname($output);
            file_put_contents($output, json_encode(['text' => str_repeat('x', 5000)], JSON_THROW_ON_ERROR));

            return true;
        });

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('exceeded');

        try {
            (new DoclingDocumentTextExtractor($runner))->extract($this->source);
        } finally {
            $this->assertNotNull($workingDirectory);
            $this->assertDirectoryDoesNotExist($workingDirectory);
        }
    }
}
