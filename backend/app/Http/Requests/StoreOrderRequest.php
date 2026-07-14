<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route is behind auth:sanctum
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['quote', 'order', 'rental'])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.slug' => ['required', 'string'],
            'items.*.name' => ['required', 'string'],
            'items.*.mode' => ['nullable', Rule::in(['buy', 'rent'])],
            'items.*.qty' => ['nullable', 'integer', 'min:1'],
            'items.*.from' => ['nullable', 'string'],
            'items.*.to' => ['nullable', 'string'],
            'items.*.price' => ['nullable', 'string'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
