<?php

namespace App\Http\Requests\API\V1\Transaction;

use App\Models\Transaction;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class IndexTransactionsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', Transaction::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'size' => 'sometimes|integer|min:1|max:30',
            'page' => 'sometimes|integer|min:1',
            'filter.name' => 'sometimes|string|max:255',
            'filter.description' => 'sometimes|string|max:255',
            // ex:
            // filter[amount]=>100 or
            // filter[amount]=>=100 or
            // filter[amount]=<100 or
            // filter[amount]=!100
            'filter.amount' => 'sometimes|string|regex:/^[><=!]+-?[0-9]+(\.[0-9]+)?$/',
            // ex:
            // filter[starts_before]=date,2023-12-31 or
            // filter[starts_before]=created_at,2023-12-31 23:59:59
            'filter.starts_before' => 'sometimes|string|regex:/^([a-z_]+),(\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2})?)$/',
            // ex:
            // filter[in_between]=updated_at,2023-01-01,2023-12-31 or
            // filter[in_between]=date,2023-01-01 00:00:00,2023-12-31 23:59:59
            'filter.in_between' => 'sometimes|string|regex:/^([a-z_]+),(\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2})?),(\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2})?)$/',
            // ex:
            // filter[ends_after]=date,2023-12-31 or
            // filter[ends_after]=date,2023-12-31 00:00:00
            'filter.ends_after' => 'sometimes|string|regex:/^([a-z_]+),(\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2})?)$/',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'size' => $this->input('size', 10),
            'page' => $this->input('page', 1),
        ]);
    }
}
