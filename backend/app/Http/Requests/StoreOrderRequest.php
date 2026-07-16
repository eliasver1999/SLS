<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route is behind auth:sanctum; only admin-approved members may order.
        return (bool) $this->user()?->isApproved();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['quote', 'order'])],
            'items' => ['required', 'array', 'min:1'],
            // Only slug + qty are trusted from the client; name/price/mode are
            // resolved server-side from the product to prevent tampering.
            'items.*.slug' => ['required', 'string', Rule::exists('products', 'slug')],
            'items.*.qty' => ['nullable', 'integer', 'min:1', 'max:9999'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
