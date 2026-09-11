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
        $order = $this->resource;
        $deposit = TransactionalMail::depositCents($order);
        $total = (int) $this->total_cents;
        $paid = $order->paidCents();
        $outstanding = $order->outstandingCents();

        // What to ask for now, decided by what has arrived rather than by
        // the status alone. Before this the completion email told everyone
        // "the remaining amount is due", including people who had paid.
        $due = null;
        $dueCents = 0;

        if ($outstanding > 0) {
            $due = match ($this->status) {
                // Still short of the deposit, so that is what to chase.
                'confirmed', 'in_production' => $paid < $deposit ? 'deposit' : null,
                'completed' => 'balance',
                default => null,
            };

            $dueCents = $due === 'deposit' ? $deposit - $paid : $outstanding;
        }

        return [
            'deposit_percent' => (int) config('sls.deposit_percent'),
            'deposit_cents' => $deposit,
            'balance_cents' => $total - $deposit,
            'deposit' => Money::format($deposit, $this->currency),
            'balance' => Money::format($total - $deposit, $this->currency),

            'paid_cents' => $paid,
            'outstanding_cents' => $outstanding,
            'paid' => Money::format($paid, $this->currency),
            'outstanding' => Money::format($outstanding, $this->currency),
            'settled' => $total > 0 && $outstanding === 0,

            // Which instalment to transfer now, and how much of it is left.
            'due' => $due,
            'due_cents' => $dueCents,
            'due_amount' => Money::format($dueCents, $this->currency),

            'reference' => $this->reference,
            'iban' => $due ? config('sls.iban') : null,
            'bank_name' => $due ? config('sls.bank_name') : null,
            'account_name' => $due ? config('sls.account_name') : null,

            // The receipts, so the customer can see what we have against
            // their order rather than taking the total on trust.
            'received' => $order->payments->map(fn ($p) => [
                'id' => $p->id,
                'amount' => Money::format($p->amount_cents, $this->currency),
                'amount_cents' => $p->amount_cents,
                'received_on' => $p->received_on?->toDateString(),
                'method' => $p->method,
                'reference' => $p->reference,
            ])->values(),
        ];
    }
}
