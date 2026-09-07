<?php

namespace App\Http\Resources;

use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'type' => $this->type,
            'status' => $this->status,
            'contact_name' => $this->contact_name,
            'contact_email' => $this->contact_email,
            'company' => $this->company,
            'vat_number' => $this->vat_number,
            'event_type' => $this->event_type,
            'event_date' => $this->event_date?->toDateString(),
            'venue' => $this->venue,
            'delivery_address' => $this->delivery_address,
            'currency' => $this->currency,
            'items' => collect($this->items ?? [])->map(fn (array $item) => [
                ...$item,
                'unit_price' => Money::format($item['unit_price_cents'] ?? null, $this->currency),
                'line_total' => Money::format($item['line_total_cents'] ?? null, $this->currency),
            ])->all(),
            'subtotal_cents' => $this->subtotal_cents,
            'vat_percent' => $this->vat_percent,
            'vat_cents' => $this->vat_cents,
            'total_cents' => $this->total_cents,
            // Formatted alongside the cents so every screen and email renders
            // the amount identically instead of each rolling its own.
            'subtotal' => Money::format($this->subtotal_cents, $this->currency),
            'vat' => Money::format($this->vat_cents, $this->currency),
            'total' => Money::format($this->total_cents, $this->currency),
            'notes' => $this->notes,
            'documents' => $this->whenLoaded('documents', fn () => $this->documents->map(fn ($d) => [
                'id' => $d->id,
                'kind' => $d->kind,
                'name' => $d->original_name,
                'mime' => $d->mime,
                'size' => $d->size,
                'created_at' => $d->created_at?->toIso8601String(),
            ]), []),
            'status_history' => $this->status_history ?? [],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
