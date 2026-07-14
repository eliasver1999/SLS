<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePartnerApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'company' => ['required', 'string', 'max:160'],
            'vat' => ['nullable', 'string', 'max:40'],
            'contact_name' => ['required', 'string', 'max:120'],
            'role' => ['nullable', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:180'],
            'phone' => ['nullable', 'string', 'max:40'],
            'buys' => ['nullable', 'array'],
            'buys.*' => ['string', 'max:40'],
            'message' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
