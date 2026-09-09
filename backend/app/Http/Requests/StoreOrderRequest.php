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
            // Deliberately absent: 'type'. There used to be two doors — "Request
            // a quote" and "Submit as an order" — leading to the same corridor,
            // because both arrived as an unpriced request that the team priced
            // and confirmed. Asking the customer to pick between them was
            // asking them to guess at our internal process.
            //
            // Every submission is now an order at the prices shown. The team
            // may discount it; a customer never has to agree to paying less.

            'items' => ['required', 'array', 'min:1'],
            // Only slug + qty are trusted from the client; name/price/mode are
            // resolved server-side from the product to prevent tampering.
            'items.*.slug' => ['required', 'string', Rule::exists('products', 'slug')],
            'items.*.qty' => ['nullable', 'integer', 'min:1', 'max:9999'],
            // How the customer wants it built (panel layout, rigging, etc).
            'items.*.configuration' => ['nullable', 'string', 'max:160'],
            'notes' => ['nullable', 'string', 'max:2000'],

            // An order is committed work that has to be built, delivered and
            // crewed, so it must say when and where. A quote is still
            // exploratory — the customer may not have booked a venue yet.
            'event_type' => ['nullable', 'string', 'max:120'],
            // Always required now. An order is committed work that has to be
            // built, delivered and crewed. Someone who does not yet know when
            // or where wants the contact form, not a priced order.
            'event_date' => ['required', 'date', 'after_or_equal:today'],
            'venue' => ['required', 'string', 'max:180'],
            'delivery_address' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'event_date.required' => 'Please give the event date so we can schedule crew and delivery.',
            'event_date.after_or_equal' => 'The event date cannot be in the past.',
            'venue.required' => 'Please give the venue so we can plan delivery and setup.',
        ];
    }
}
