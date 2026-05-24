<?php

namespace App\Http\Requests\API\V1\Tracker;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ShowTrackerReportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('viewReports', $this->route('tracker'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'range' => 'required|array',
            'range.days' => 'required|integer|min:1|max:365',
        ];
    }

    public function prepareForValidation()
    {
        return $this->merge([
            'range' => [
                'days' => $this->query('range')['days'] ?? 7,
            ],
        ]);
    }
}
