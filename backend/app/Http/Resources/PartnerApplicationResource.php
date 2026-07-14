<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PartnerApplicationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'company' => $this->company,
            'vat' => $this->vat,
            'contact_name' => $this->contact_name,
            'role' => $this->role,
            'email' => $this->email,
            'phone' => $this->phone,
            'buys' => $this->buys ?? [],
            'message' => $this->message,
            'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
