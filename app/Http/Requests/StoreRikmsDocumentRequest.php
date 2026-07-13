<?php

namespace App\Http\Requests;

use App\Models\Document;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreRikmsDocumentRequest extends FormRequest
{
    private const PUBLIC_FIELDS = [
        'title', 'abstract', 'methodology', 'review_of_related_literature',
        'theoretical_framework', 'results_and_discussion', 'authors', 'keywords', 'doi',
    ];

    public function authorize(): bool
    {
        return $this->user()?->can('create', Document::class) === true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['metadata', 'public_fields', 'sdg_tags', 'projects', 'pap', 'financials', 'highlight'] as $key) {
            $value = $this->input($key);
            if (is_string($value)) {
                $decoded = json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $this->merge([$key => $decoded]);
                }
            }
        }

        if ($this->has('access_mode')) {
            $this->merge(['access_mode' => $this->normalizeAccessMode((string) $this->input('access_mode'))]);
        }

        if (is_array($this->input('metadata'))) {
            $metadata = $this->input('metadata');
            $metadata['review_of_related_literature'] ??= $metadata['relatedLiterature'] ?? null;
            $metadata['theoretical_framework'] ??= $metadata['theoreticalFramework'] ?? null;
            $metadata['results_and_discussion'] ??= $metadata['resultsDiscussion'] ?? null;
            foreach (['keywords', 'authors'] as $field) {
                if (isset($metadata[$field]) && is_string($metadata[$field])) {
                    $metadata[$field] = collect(preg_split('/[,;\n]+/', $metadata[$field]))
                        ->map(fn (string $item) => trim($item))->filter()->values()->all();
                }
            }
            $this->merge(['metadata' => $metadata]);
        }
    }

    public function rules(): array
    {
        return [
            'document_type' => ['required', Rule::in(['research', 'terminal', 'pap', ...$this->internalTypes()])],
            'submit_mode' => ['required', Rule::in(['draft', 'submit'])],
            'title' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:10000'],
            'category' => ['nullable', 'string', 'max:255'],
            'year' => ['nullable', 'integer', 'between:1900,'.(now()->year + 5)],
            'quarter' => ['nullable', 'string', Rule::in(['Q1', 'Q2', 'Q3', 'Q4', '1', '2', '3', '4', 'Annual'])],
            'access_mode' => ['nullable', Rule::in($this->accessModes())],
            'embargo_until' => ['nullable', 'date', 'after:today', 'required_if:access_mode,embargo_until_date'],
            'external_url' => ['nullable', 'url:http,https', 'max:2048', 'required_if:access_mode,external_link_only'],
            'owner_name' => ['nullable', 'string', 'max:255'],
            'owner_email' => ['nullable', 'email:rfc', 'max:255'],
            'notify_access_requests' => ['nullable', 'boolean'],
            'notify_research_inquiries' => ['nullable', 'boolean'],
            'send_copy_to_agency_admin' => ['nullable', 'boolean'],
            'document_file' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:51200'],
            'highlight_file' => ['nullable', 'file', 'mimes:png,jpg,jpeg,pdf', 'max:10240'],

            'metadata' => ['nullable', 'array'],
            'metadata.title' => ['nullable', 'string', 'max:500'],
            'metadata.abstract' => ['nullable', 'string', 'max:20000'],
            'metadata.methodology' => ['nullable', 'string', 'max:30000'],
            'metadata.review_of_related_literature' => ['nullable', 'string', 'max:30000'],
            'metadata.theoretical_framework' => ['nullable', 'string', 'max:30000'],
            'metadata.results_and_discussion' => ['nullable', 'string', 'max:30000'],
            'metadata.keywords' => ['nullable', 'array', 'max:100'],
            'metadata.keywords.*' => ['string', 'max:255', 'distinct'],
            'metadata.authors' => ['nullable', 'array', 'max:100'],
            'metadata.authors.*' => ['string', 'max:500'],
            'metadata.doi' => ['nullable', 'string', 'max:255'],

            'public_fields' => ['nullable', 'array', 'max:20'],
            'public_fields.*' => ['string', 'distinct', Rule::in(self::PUBLIC_FIELDS)],
            'sdg_tags' => ['nullable', 'array', 'max:17'],
            'sdg_tags.*' => ['integer', 'distinct', 'between:1,17'],

            'projects' => ['nullable', 'array', 'max:100'],
            'projects.*.target' => ['nullable', 'string', 'max:1000'],
            'projects.*.actualPct' => ['nullable', 'numeric', 'between:0,1000000000'],
            'projects.*.accomplishmentPct' => ['nullable', 'numeric', 'between:0,1000'],

            'pap' => ['nullable', 'array'],
            'pap.categories' => ['nullable', 'array', 'max:30'],
            'pap.categories.*' => ['string', 'max:255', 'distinct'],
            'pap.sectors' => ['nullable', 'array', 'max:20'],
            'pap.sectors.*' => ['string', 'max:100', 'distinct'],
            'pap.description' => ['nullable', 'string', 'max:10000'],

            'financials' => ['nullable', 'array'],
            'financials.allocated' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99'],
            'financials.released' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99'],
            'financials.obligated' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99'],
            'financials.used' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99'],
            'financials.asOfDate' => ['nullable', 'date'],

            'highlight' => ['nullable', 'array'],
            'highlight.title' => ['nullable', 'string', 'max:500'],
            'highlight.description' => ['nullable', 'string', 'max:10000'],
            'highlight.featured' => ['nullable', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $title = trim((string) data_get($this->all(), 'metadata.title', $this->input('title')));
            if ($this->input('submit_mode') === 'submit' && $title === '') {
                $validator->errors()->add('metadata.title', 'A title is required before submission.');
            }

            $allocated = data_get($this->all(), 'financials.allocated');
            $used = data_get($this->all(), 'financials.used');
            if ($allocated !== null && $used !== null && (float) $used > (float) $allocated) {
                $validator->errors()->add('financials.used', 'Utilized amount cannot exceed the allotted budget.');
            }
        }];
    }

    protected function internalTypes(): array
    {
        return [Document::RESEARCH_STUDY, Document::TERMINAL_REPORT, Document::PROJECT_ACCOMPLISHMENT_REPORT];
    }

    protected function accessModes(): array
    {
        return ['public_download', 'request_access', 'restricted_admin', 'embargo_until_date', 'external_link_only'];
    }

    private function normalizeAccessMode(string $mode): string
    {
        return [
            'public' => 'public_download', 'request' => 'request_access',
            'restricted' => 'restricted_admin', 'embargo' => 'embargo_until_date',
            'external' => 'external_link_only',
        ][$mode] ?? $mode;
    }
}
