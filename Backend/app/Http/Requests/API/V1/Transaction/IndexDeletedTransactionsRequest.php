<?php

namespace App\Http\Requests\API\V1\Transaction;

use App\Models\Transaction;
use Illuminate\Contracts\Validation\ValidationRule;

class IndexDeletedTransactionsRequest extends IndexTransactionsRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('viewAnyDeleted', Transaction::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_merge_recursive(parent::rules(), [
            //
        ]);
    }
}
