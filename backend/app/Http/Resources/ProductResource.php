<?php

namespace App\Http\Resources;

use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Arr;

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
            'pitchMm' => $this->pitch_mm,
            'tag' => $this->tag,
            'image' => $this->image,
            'thumbs' => $this->thumbs,
            'blurb' => $this->blurb,
            'cardSpecs' => $this->card_specs,
            'specTable' => $this->spec_table,
            'modes' => $this->modes,
            'buy' => $this->buyFor($request),
            'featured' => $this->featured,
        ];
    }

    /**
     * Buy details with the list price removed for anyone who is not an approved
     * partner. Net pricing is what the B2B tier sells, so it must not leave the
     * API for guests or still-pending accounts — hiding it in CSS only puts it
     * one devtools toggle away. Lead time and unit stay public: they are specs.
     *
     * @return array<string, mixed>|null
     */
    private function buyFor(Request $request): ?array
    {
        if (! $this->buy) {
            return null;
        }

        // The product routes are public, so the bearer token has to be resolved
        // through Sanctum's guard by name — the default guard is session-based
        // and would report a guest for every token-authenticated request.
        $buy = $this->buy;

        if ($request->user('sanctum')?->isApproved()) {
            return [
                ...$buy,
                'price_cents' => $this->buy_price_cents,
                'price' => Money::format($this->buy_price_cents),
            ];
        }

        return Arr::except($buy, ['price', 'price_cents']);
    }
}
