<x-mail::message>
# New {{ $order->type }} — {{ $order->reference }}

A customer just submitted a **{{ $order->type }}** request. Follow up to send the SOW / quote.

<x-mail::table>
| Field | Value |
|:------|:------|
| Reference | {{ $order->reference }} |
| Type | {{ ucfirst($order->type) }} |
| Company | {{ $order->company }} |
| Contact | {{ $order->contact_name }} |
| Email | {{ $order->contact_email }} |
@if ($order->notes)
| Notes | {{ $order->notes }} |
@endif
</x-mail::table>

**Items**
@foreach ($order->items as $item)
- {{ $item['name'] }} — {{ ($item['mode'] ?? '') === 'rent' ? 'Rent' : 'Buy' }}@if(!empty($item['qty'])) ×{{ $item['qty'] }}@endif @if(!empty($item['from'])) ({{ $item['from'] }}–{{ $item['to'] }})@endif @if(!empty($item['price'])) — {{ $item['price'] }}@endif
@endforeach

<x-mail::button :url="config('app.url')">
Open admin
</x-mail::button>

SLS internal notification.
</x-mail::message>
