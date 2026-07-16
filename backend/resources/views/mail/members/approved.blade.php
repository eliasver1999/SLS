<x-mail::message>
# You're approved, {{ $user->name }} 🎉

@if ($user->company)
Good news — your SLS account for **{{ $user->company }}** has been approved.
@else
Good news — your SLS account has been approved.
@endif

You now have full **B2B access**: sign in to see net pricing, add items to a quote and submit order requests.

<x-mail::button :url="config('app.url')">
Sign in to SLS
</x-mail::button>

As always, no payment is taken on the website — our team confirms details and invoices by bank transfer (IBAN), with {{ config('sls.vat_percent') }}% VAT added on the invoice.

Questions? Just reply to this email or contact {{ config('sls.sales_email') }}.

Thanks,
Sound. Lights. Screens.
</x-mail::message>
