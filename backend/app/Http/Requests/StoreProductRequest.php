<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route is protected by the `admin` middleware
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $productId = $this->route('product')?->id;
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'slug' => [$required, 'string', 'max:80', Rule::unique('products', 'slug')->ignore($productId)],
            'name' => [$required, 'string', 'max:120'],
            'category' => [$required, Rule::in(['screens', 'lighting', 'sound', 'package'])],
            'placement_key' => [$required, 'string', 'max:40'],
            'image' => [$required, 'string', 'max:255'],
            'tag' => [$required, 'array'],
            'tag.en' => [$required, 'string'],
            'tag.el' => [$required, 'string'],
            'blurb' => ['nullable', 'array'],
            'thumbs' => ['nullable', 'array'],
            'card_specs' => ['nullable', 'array'],
            'spec_table' => ['nullable', 'array'],
            'modes' => [$required, 'array'],
            'modes.*' => [Rule::in(['buy', 'rent'])],
            'buy' => ['nullable', 'array'],
            'rent' => ['nullable', 'array'],
            'featured' => ['boolean'],
            'sort' => ['nullable', 'integer'],
        ];
    }
}
