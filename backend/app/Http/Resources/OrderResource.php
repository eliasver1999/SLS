<?php

namespace App\Http\Resources;

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
            'event_type' => $this->event_type,
            'event_date' => $this->event_date?->toDateString(),
            'venue' => $this->venue,
            'delivery_address' => $this->delivery_address,
            'items' => $this->items,
            'total' => $this->total,
            'notes' => $this->notes,
            'status_history' => $this->status_history ?? [],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
