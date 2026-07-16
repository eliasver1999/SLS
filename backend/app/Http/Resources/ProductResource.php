<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Emits the exact shape the frontend `Product` type expects (camelCase keys),
 * so the React catalogue/product pages consume it with no transform.
 */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'category' => $this->category,
            'placementKey' => $this->placement_key,
            'tag' => $this->tag,
            'image' => $this->image,
            'thumbs' => $this->thumbs,
            'blurb' => $this->blurb,
            'cardSpecs' => $this->card_specs,
            'specTable' => $this->spec_table,
            'modes' => $this->modes,
            'buy' => $this->buy,
            'featured' => $this->featured,
        ];
    }
}
