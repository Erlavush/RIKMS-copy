<?php

namespace Tests\Feature;

use App\Contracts\DocumentAnalysisProvider;
use App\Models\Document;
use App\Services\DocumentTextExtractionService;
use App\Services\OllamaDocumentAnalysisService;
use App\Services\RikmsMetadataSchema;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class OllamaDocumentAnalysisTest extends TestCase
{
    public function test_local_provider_sends_strict_schema_and_validates_ollama_metadata(): void
    {
        $suggestions = $this->validSuggestions();
        Http::fake([
            'http://127.0.0.1:11434/api/chat' => Http::response([
                'message' => ['role' => 'assistant', 'content' => json_encode($suggestions, JSON_THROW_ON_ERROR)],
                'prompt_eval_count' => 321,
                'eval_count' => 144,
            ]),
        ]);

        $result = $this->serviceWithText("--- PAGE 1 ---\nA local research paper with supported metadata.")
            ->analyze(new Document);

        $this->assertEquals($suggestions, $result['suggestions']);
        $this->assertSame('embedded_pdf_text', $result['extraction_method']);
        $this->assertSame(321, $result['input_tokens']);
        $this->assertSame(144, $result['output_tokens']);
        $this->assertSame(0.0, $result['estimated_cost_usd']);

        Http::assertSent(function (Request $request): bool {
            $payload = $request->data();

            return $request->url() === 'http://127.0.0.1:11434/api/chat'
                && $payload['model'] === 'qwen3.5:4b'
                && $payload['stream'] === false
                && $payload['think'] === false
                && $payload['options']['temperature'] === 0
                && $payload['options']['num_ctx'] === 8192
                && $payload['options']['num_predict'] === 8192
                && $payload['format']['type'] === 'object'
                && $payload['format']['additionalProperties'] === false
                && in_array('title', $payload['format']['required'], true)
                && str_contains($payload['messages'][1]['content'], 'UNTRUSTED DOCUMENT START')
                && str_contains($payload['messages'][1]['content'], '--- PAGE 1 ---');
        });
    }

    public function test_selected_provider_resolves_to_ollama_locally(): void
    {
        config()->set('rikms.ai.provider', 'ollama');

        $this->assertInstanceOf(
            OllamaDocumentAnalysisService::class,
            $this->app->make(DocumentAnalysisProvider::class),
        );
    }

    public function test_non_loopback_ollama_url_is_rejected_before_document_access(): void
    {
        $this->configureOllama();
        config()->set('rikms.ai.ollama.base_url', 'https://models.example.test');
        $extractor = Mockery::mock(DocumentTextExtractionService::class);
        $extractor->shouldNotReceive('extract');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('loopback-only');

        (new OllamaDocumentAnalysisService($extractor, new RikmsMetadataSchema))->analyze(new Document);
    }

    public function test_invalid_model_json_fails_safely(): void
    {
        Http::fake([
            'http://127.0.0.1:11434/api/chat' => Http::response([
                'message' => ['role' => 'assistant', 'content' => 'not json'],
            ]),
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Ollama returned invalid JSON.');

        $this->serviceWithText('Extractable research text')->analyze(new Document);
    }

    public function test_out_of_range_sdg_is_rejected_by_laravel(): void
    {
        $suggestions = $this->validSuggestions();
        $suggestions['suggested_sdgs'][0]['number'] = 18;
        Http::fake([
            'http://127.0.0.1:11434/api/chat' => Http::response([
                'message' => ['role' => 'assistant', 'content' => json_encode($suggestions, JSON_THROW_ON_ERROR)],
            ]),
        ]);

        $this->expectException(ValidationException::class);

        $this->serviceWithText('Extractable research text')->analyze(new Document);
    }

    public function test_unknown_model_field_is_rejected_instead_of_silently_accepted(): void
    {
        $suggestions = $this->validSuggestions();
        $suggestions['publish_now'] = true;
        Http::fake([
            'http://127.0.0.1:11434/api/chat' => Http::response([
                'message' => ['role' => 'assistant', 'content' => json_encode($suggestions, JSON_THROW_ON_ERROR)],
            ]),
        ]);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('unsupported metadata fields');

        $this->serviceWithText('Extractable research text')->analyze(new Document);
    }

    public function test_scanned_pdf_without_ocr_returns_a_controlled_error(): void
    {
        $this->configureOllama();
        $extractor = Mockery::mock(DocumentTextExtractionService::class);
        $extractor->shouldReceive('extract')->once()->andReturnNull();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('A scanned PDF requires OCR');

        (new OllamaDocumentAnalysisService($extractor, new RikmsMetadataSchema))->analyze(new Document);
    }

    private function serviceWithText(string $text): OllamaDocumentAnalysisService
    {
        $this->configureOllama();
        $extractor = Mockery::mock(DocumentTextExtractionService::class);
        $extractor->shouldReceive('extract')->once()->andReturn([
            'method' => 'embedded_pdf_text',
            'text' => $text,
        ]);

        return new OllamaDocumentAnalysisService($extractor, new RikmsMetadataSchema);
    }

    private function configureOllama(): void
    {
        config()->set('rikms.ai.enabled', true);
        config()->set('rikms.ai.ollama.base_url', 'http://127.0.0.1:11434');
        config()->set('rikms.ai.ollama.model', 'qwen3.5:4b');
        config()->set('rikms.ai.ollama.num_ctx', 8192);
        config()->set('rikms.ai.ollama.max_input_characters', 24000);
        config()->set('rikms.ai.ollama.keep_alive', '30m');
    }

    /** @return array<string, mixed> */
    private function validSuggestions(): array
    {
        return [
            'title' => 'Local Qwen Metadata Extraction',
            'abstract' => 'A test abstract supported by the document.',
            'methodology' => 'Descriptive research design.',
            'review_of_related_literature' => '',
            'theoretical_framework' => '',
            'results_and_discussion' => 'The structured extraction completed.',
            'keywords' => ['metadata', 'offline AI'],
            'authors' => ['Demo Researcher'],
            'doi' => '',
            'category' => 'Information Technology',
            'executive_summary' => 'A local demonstration of review-gated metadata extraction.',
            'recommendations' => ['Review every suggested field.'],
            'suggested_sdgs' => [[
                'number' => 9,
                'reason' => 'The paper discusses digital research infrastructure.',
                'confidence' => 0.82,
            ]],
            'overall_confidence' => 0.84,
            'evidence_pages' => [1],
        ];
    }
}
