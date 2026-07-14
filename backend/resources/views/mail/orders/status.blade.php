@php
    $messages = [
        'quoted' => 'We’ve prepared your quote — our team will email the details and next steps.',
        'confirmed' => 'Your request is confirmed. We’ll follow up with the Scope of Work and invoice.',
        'in_production' => 'Good news — your order is now in production. We’ll let you know when it’s ready to dispatch.',
        'completed' => 'This request is complete. Thank you for working with SLS!',
        'cancelled' => 'This request has been cancelled. If that’s unexpected, just reply and we’ll sort it out.',
        'pending' => 'Your request is being reviewed by our team.',
    ];
@endphp
<x-mail::message>
# Update on {{ $order->reference }}

Hi {{ $order->contact_name }}, the status of your {{ $order->type }} is now:

<x-mail::panel>
**{{ $statusLabel }}**
</x-mail::panel>

{{ $messages[$order->status] ?? 'Your request has been updated.' }}

@if (in_array($order->status, ['confirmed', 'in_production']) && $order->type !== 'quote')
As a reminder, payment is by bank transfer (IBAN) against our invoice — a {{ config('sls.deposit_percent') }}% deposit with the balance before {{ $order->type === 'rental' ? 'delivery' : 'dispatch' }}. Reference **{{ $order->reference }}**.
@endif

Questions? Contact {{ config('sls.sales_email') }}.

Thanks,
Sound. Lights. Screens.
</x-mail::message>
