@php
    // Pipes would break out of a markdown table cell, so neutralise them in
    // any value that can contain customer free text.
    $cell = fn ($value) => str_replace(['|', "\r", "\n"], ['\|', '', ' '], (string) ($value ?? '—'));
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

@if (in_array('items_table', $blocks, true) && ! empty($items))
<x-mail::table>
| Item | Qty | Est. price |
|:-----|:----|:-----------|
@foreach ($items as $item)
| {{ $cell($item['name'] ?? null) }} | {{ $cell($item['qty'] ?? '—') }} | {{ $cell($item['price'] ?? '—') }} |
@endforeach
</x-mail::table>
@endif

@if (in_array('note_panel', $blocks, true) && ! empty($vars['note']))
<x-mail::panel>
**A note from our team:** {{ $vars['note'] }}
</x-mail::panel>
@endif

@if (in_array('total_line', $blocks, true) && ! empty($vars['total']))
**Total (ex VAT):** {{ $vars['total'] }}
@endif

@if (in_array('bank_panel', $blocks, true))
<x-mail::panel>
**Bank transfer (IBAN)**
Account: {{ $vars['account_name'] ?? '' }}
Bank: {{ $vars['bank_name'] ?? '' }}
IBAN: **{{ $vars['iban'] ?? '' }}**
Payment reference: **{{ $vars['reference'] ?? '' }}**
</x-mail::panel>
@endif

@if (in_array('signin_button', $blocks, true))
<x-mail::button :url="$vars['app_url'] ?? config('app.url')">
Sign in to SLS
</x-mail::button>
@endif

@if (in_array('admin_button', $blocks, true))
<x-mail::button :url="$vars['app_url'] ?? config('app.url')">
Open admin
</x-mail::button>
@endif
</x-mail::message>
