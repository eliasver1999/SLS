@php
    $deposit = config('sls.deposit_percent');
    $balance = 100 - $deposit;
    $isQuote = $order->type === 'quote';
    $isRental = $order->type === 'rental';
    $noun = $isQuote ? 'quote request' : ($isRental ? 'booking request' : 'order request');
@endphp
<x-mail::message>
# Thanks, {{ $order->contact_name }} 👋

We’ve received your **{{ $noun }}** ({{ $order->reference }}) for **{{ $order->company }}**.
No payment is taken on the website — everything is handled by our team, as set out below.

<x-mail::table>
| Item | Details | Est. price |
|:-----|:--------|:-----------|
@foreach ($order->items as $item)
| {{ $item['name'] }} | {{ ($item['mode'] ?? '') === 'rent' ? 'Rent' : 'Buy' }}@if(!empty($item['qty'])) · ×{{ $item['qty'] }}@endif @if(!empty($item['from'])) · {{ $item['from'] }}–{{ $item['to'] }}@endif | {{ $item['price'] ?? '—' }} |
@endforeach
</x-mail::table>

@if ($isQuote)
## What happens next
Our team will prepare a formal quote and email it to you, usually **within one business day**. Once you approve it, we’ll send a Scope of Work and payment details.
@else
## How payment works
1. We email you a **Scope of Work (SOW)** confirming the details.
2. A **{{ $deposit }}% deposit** {{ $isRental ? 'secures your booking dates' : 'confirms the order and starts production' }} — pay by bank transfer (IBAN) to the account below.
3. The remaining **{{ $balance }}%** is due **before {{ $isRental ? 'delivery / setup' : 'dispatch' }}**.

All prices are **ex VAT**; **{{ config('sls.vat_percent') }}% VAT** is added on the invoice.

<x-mail::panel>
**Bank transfer (IBAN)**
Account: {{ config('sls.account_name') }}
Bank: {{ config('sls.bank_name') }}
IBAN: **{{ config('sls.iban') }}**
Payment reference: **{{ $order->reference }}**
</x-mail::panel>

Please **do not transfer any deposit yet** — wait for our SOW and invoice so the amount and reference are confirmed.
@endif

A member of the SLS team will be in touch shortly to finalise everything. Questions? Just reply to this email or contact {{ config('sls.sales_email') }}.

Thanks,
Sound. Lights. Screens.
</x-mail::message>
