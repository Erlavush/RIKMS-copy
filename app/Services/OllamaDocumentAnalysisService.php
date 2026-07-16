<?php

namespace App\Services;

use App\Contracts\DocumentAnalysisProvider;
use App\Models\Document;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OllamaDocumentAnalysisService implements DocumentAnalysisProvider
{
    public function __construct(
        private readonly DocumentTextExtractionService $extractor,
        private readonly RikmsMetadataSchema $metadata,
    ) {}

    /** @return array{suggestions: array<string, mixed>, extraction_method: string, input_tokens: int, output_tokens: int, reasoning_tokens: int, estimated_cost_usd: float} */
    public function analyze(Document $document): array
    {
        if (! config('rikms.ai.enabled')) {
            throw new RuntimeException('RIKMS AI document assistance is disabled.');
        }
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('The Ollama provider is restricted to local development and testing.');
        }

        $baseUrl = $this->loopbackBaseUrl((string) config('rikms.ai.ollama.base_url'));
        $model = trim((string) config('rikms.ai.ollama.model'));
        if ($model === '' || mb_strlen($model) > 200 || preg_match('/[\x00-\x1F\x7F]/', $model)) {
            throw new RuntimeException('Ollama model configuration is invalid.');
        }

        $extracted = $this->extractor->extract($document);
        if ($extracted === null || trim($extracted['text']) === '') {
            throw new RuntimeException('The PDF contains no extractable text. A scanned PDF requires OCR before local AI analysis.');
        }

        $configuredMaximum = (int) config('rikms.ai.ollama.max_input_characters');
        $maximumCharacters = min(120000, max(1000, $configuredMaximum));
        $documentText = mb_substr($extracted['text'], 0, $maximumCharacters);
        $response = Http::acceptJson()
            ->timeout((int) config('rikms.ai.timeout_seconds'))
            ->retry(1, 500, throw: false)
            ->post($baseUrl.'/api/chat', [
                'model' => $model,
                'stream' => false,
                'think' => false,
                'keep_alive' => (string) config('rikms.ai.ollama.keep_alive'),
                'format' => $this->metadata->ollamaResponseSchema(),
                'messages' => [
                    ['role' => 'system', 'content' => $this->metadata->systemInstruction()],
                    [
                        'role' => 'user',
                        'content' => $this->metadata->analysisInstruction()
                            ."\n\nUNTRUSTED DOCUMENT START\n"
                            .$documentText
                            ."\nUNTRUSTED DOCUMENT END",
                    ],
                ],
                'options' => [
                    'temperature' => 0,
                    'num_ctx' => max(2048, min(32768, (int) config('rikms.ai.ollama.num_ctx'))),
                    'num_predict' => 8192,
                ],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Ollama request failed with HTTP '.$response->status().'.');
        }

        $json = (string) $response->json('message.content', '');
        $suggestions = json_decode($json, true);
        if (! is_array($suggestions)) {
            throw new RuntimeException('Ollama returned invalid JSON.');
        }

        return [
            'suggestions' => $this->metadata->validate($suggestions),
            'extraction_method' => $extracted['method'],
            'input_tokens' => (int) $response->json('prompt_eval_count', 0),
            'output_tokens' => (int) $response->json('eval_count', 0),
            'reasoning_tokens' => 0,
            'estimated_cost_usd' => 0.0,
        ];
    }

    private function loopbackBaseUrl(string $value): string
    {
        $baseUrl = rtrim(trim($value), '/');
        $parts = parse_url($baseUrl);
        if (! is_array($parts)) {
            throw new RuntimeException('Ollama must use a valid absolute loopback-only base URL.');
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = strtolower((string) ($parts['host'] ?? ''));
        $path = (string) ($parts['path'] ?? '');
        if (! in_array($scheme, ['http', 'https'], true)
            || ! in_array($host, ['127.0.0.1', 'localhost', '::1'], true)
            || ! in_array($path, ['', '/'], true)
            || isset($parts['user'])
            || isset($parts['pass'])
            || isset($parts['query'])
            || isset($parts['fragment'])) {
            throw new RuntimeException('Ollama must use an absolute loopback-only base URL without credentials or a path.');
        }

        return $baseUrl;
    }
}
