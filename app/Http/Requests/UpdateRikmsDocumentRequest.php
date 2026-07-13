<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateRikmsDocumentRequest extends StoreRikmsDocumentRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('document')) === true;
    }

    public function rules(): array
    {
        $rules = parent::rules();
        unset($rules['document_type'], $rules['submit_mode']);

        $rules['document_type'] = ['sometimes', Rule::in(['research', 'terminal', 'pap', ...$this->internalTypes()])];
        $rules['submit_mode'] = ['prohibited'];
        $rules['status'] = ['prohibited'];
        $rules['change_summary'] = ['nullable', 'string', 'max:2000'];
        $rules['document_file'] = ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:51200'];

        foreach ($rules as $key => &$rule) {
            if (is_array($rule) && in_array('required', $rule, true)) {
                $rule = array_values(array_filter($rule, fn ($item) => $item !== 'required'));
            }
        }

        return $rules;
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $document = $this->route('document');
            $allocated = data_get($this->all(), 'financials.allocated', $document?->financial?->allotted_budget);
            $used = data_get($this->all(), 'financials.used', $document?->financial?->utilized_amount);
            if ($allocated !== null && $used !== null && (float) $used > (float) $allocated) {
                $validator->errors()->add('financials.used', 'Utilized amount cannot exceed the allotted budget.');
            }
        }];
    }
}
