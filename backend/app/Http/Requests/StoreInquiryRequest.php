<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInquiryRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180'],
            'phone' => ['nullable', 'string', 'max:40'],
            'event_type' => ['required', 'string', 'max:80'],
            'event_date' => ['nullable', 'date', 'after_or_equal:today'],
            'message' => ['required', 'string', 'max:5000'],
        ];
    }
}
