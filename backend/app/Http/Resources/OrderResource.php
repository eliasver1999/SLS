<?php

namespace App\Http\Resources;

use App\Services\TransactionalMail;
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
            // What the customer owes, and when. The confirmation email asks
            // for a deposit and the completion email asks for the balance;
            // the order page said nothing about either, so the email was the
            // only place the amount and the payment reference existed.
            'payment' => $this->payment(),
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

    /**
     * The payment position, derived from the same figures the emails use so
     * the page and the email can never quote different amounts.
     *
     * Nothing is due before the order is accepted, and this deliberately
     * does not claim anything has been *paid*: the system has no record of
     * incoming transfers, so it says what is due and leaves it there.
     *
     * @return array<string, mixed>
     */
    private function payment(): array
    {
        $deposit = TransactionalMail::depositCents($this->resource);
        $balance = (int) $this->total_cents - $deposit;

        $due = match ($this->status) {
            'confirmed', 'in_production' => 'deposit',
            'completed' => 'balance',
            default => null,
        };

        return [
            'deposit_percent' => (int) config('sls.deposit_percent'),
            'deposit_cents' => $deposit,
            'balance_cents' => $balance,
            'deposit' => Money::format($deposit, $this->currency),
            'balance' => Money::format($balance, $this->currency),
            // Which instalment the customer should be transferring now.
            'due' => $due,
            'reference' => $this->reference,
            'iban' => $due ? config('sls.iban') : null,
            'bank_name' => $due ? config('sls.bank_name') : null,
            'account_name' => $due ? config('sls.account_name') : null,
        ];
    }
}
