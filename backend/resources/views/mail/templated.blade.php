@php
    // Pipes would break out of a markdown table cell, so neutralise them in
    // any value that can contain customer free text.
    $cell = fn ($value) => str_replace(['|', "\r", "\n"], ['\|', '', ' '], (string) ($value ?? '—'));

    // Every clickable thing in a customer email belongs on the storefront,
    // never on the API — app_url used to be the API origin, so the approval
    // email's call to action opened a JSON document.
    $site = rtrim((string) ($vars['app_url'] ?? config('app.frontend_url')), '/');
@endphp
<x-mail::message>
{{ $body }}

@if (in_array('order_details_table', $blocks, true))
<x-mail::table>
| Field | Value |
|:------|:------|
| Reference | {{ $cell($vars['reference'] ?? null) }} |
| Type | {{ ucfirst($cell($vars['type'] ?? null)) }} |
| Company | {{ $cell($vars['company'] ?? null) }} |
| Contact | {{ $cell($vars['contact_name'] ?? null) }} |
| Email | {{ $cell($vars['contact_email'] ?? null) }} |
@if (! empty($vars['notes']))
| Notes | {{ $cell($vars['notes']) }} |
@endif
</x-mail::table>
@endif

@if (in_array('event_details_table', $blocks, true) && (! empty($vars['event_date']) || ! empty($vars['venue'])))
<x-mail::table>
| Event | Details |
|:------|:--------|
@if (! empty($vars['event_type']))
| Type | {{ $cell($vars['event_type']) }} |
@endif
@if (! empty($vars['event_date']))
| Date | {{ $cell($vars['event_date']) }} |
@endif
@if (! empty($vars['venue']))
| Venue | {{ $cell($vars['venue']) }} |
@endif
@if (! empty($vars['delivery_address']))
| Delivery | {{ $cell($vars['delivery_address']) }} |
@endif
</x-mail::table>
@endif

@if (in_array('enquiry_details_table', $blocks, true))
<x-mail::table>
| Field | Value |
|:------|:------|
| Name | {{ $cell($vars['name'] ?? null) }} |
| Email | {{ $cell($vars['email'] ?? null) }} |
@if (! empty($vars['phone']))
| Phone | {{ $cell($vars['phone']) }} |
@endif
| Event type | {{ $cell($vars['event_type'] ?? null) }} |
@if (! empty($vars['event_date']))
| Event date | {{ $cell($vars['event_date']) }} |
@endif
| Message | {{ $cell($vars['message'] ?? null) }} |
</x-mail::table>
@endif

@if (in_array('items_table', $blocks, true) && ! empty($items))
<x-mail::table>
| Item | Qty | Unit | Line total |
|:-----|:----|:-----|:-----------|
@foreach ($items as $item)
| {{ $cell($item['name'] ?? null) }}{{ ! empty($item['configuration']) ? ' — '.$cell($item['configuration']) : '' }} | {{ $cell($item['qty'] ?? '—') }} | {{ $cell(\App\Support\Money::format($item['unit_price_cents'] ?? null) ?? '—') }} | {{ $cell(\App\Support\Money::format($item['line_total_cents'] ?? null) ?? '—') }} |
@endforeach
</x-mail::table>
@endif

@if (in_array('note_panel', $blocks, true) && ! empty($vars['note']))
<x-mail::panel>
**A note from our team:** {{ $vars['note'] }}
</x-mail::panel>
@endif

@if (in_array('total_line', $blocks, true) && ! empty($vars['total']))
| | |
|:--|--:|
| Subtotal (ex VAT) | {{ $vars['subtotal'] }} |
| VAT ({{ $vars['vat_percent'] }}%) | {{ $vars['vat'] }} |
| **Total** | **{{ $vars['total'] }}** |
@endif

@if (in_array('bank_panel', $blocks, true))
<x-mail::panel>
{{-- Explicit breaks: markdown folds single newlines into spaces, which ran
     the account, bank, IBAN and reference together as one paragraph. This is
     the panel someone copies a bank account out of, so each field gets its
     own line. --}}
**Bank transfer (IBAN)**<br>
Account: {{ $vars['account_name'] ?? '' }}<br>
Bank: {{ $vars['bank_name'] ?? '' }}<br>
IBAN: **{{ $vars['iban'] ?? '' }}**<br>
Payment reference: **{{ $vars['reference'] ?? '' }}**
</x-mail::panel>
@endif

@if (in_array('order_button', $blocks, true) && ! empty($vars['order_url']))
<x-mail::button :url="$vars['order_url']">
View your order
</x-mail::button>
@endif

@if (in_array('set_password_button', $blocks, true) && ! empty($vars['set_password_url']))
<x-mail::button :url="$vars['set_password_url']">
Set your password
</x-mail::button>
@endif

@if (in_array('signin_button', $blocks, true))
<x-mail::button :url="$site.'/login'">
Sign in to SLS
</x-mail::button>
@endif

@if (in_array('admin_button', $blocks, true))
<x-mail::button :url="$site.'/admin'">
Open admin
</x-mail::button>
@endif
</x-mail::message>
