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

            // An order is committed work that has to be built, delivered and
            // crewed, so it must say when and where. A quote is still
            // exploratory — the customer may not have booked a venue yet.
            'event_type' => ['nullable', 'string', 'max:120'],
            'event_date' => ['required_if:type,order', 'nullable', 'date', 'after_or_equal:today'],
            'venue' => ['required_if:type,order', 'nullable', 'string', 'max:180'],
            'delivery_address' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'event_date.required_if' => 'Please give the event date so we can schedule crew and delivery.',
            'event_date.after_or_equal' => 'The event date cannot be in the past.',
            'venue.required_if' => 'Please give the venue so we can plan delivery and setup.',
        ];
    }
}
