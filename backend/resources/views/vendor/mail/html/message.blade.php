{{--
    Overrides Laravel's message component for one reason: the stock header
    links the logo at config('app.url'), which here is the JSON API. A
    customer clicking the SLS wordmark in an email landed on
    {"service":"SLS API","status":"ok"}.

    Everything a recipient can click has to point at the storefront, so the
    header uses FRONTEND_URL. The rest is the vendor component unchanged.
--}}
<x-mail::layout>
{{-- Header --}}
<x-slot:header>
<x-mail::header :url="config('app.frontend_url')">
{{ config('app.name') }}
</x-mail::header>
</x-slot:header>

{{-- Body --}}
{!! $slot !!}

{{-- Subcopy --}}
@isset($subcopy)
<x-slot:subcopy>
<x-mail::subcopy>
{!! $subcopy !!}
</x-mail::subcopy>
</x-slot:subcopy>
@endisset

{{-- Footer --}}
<x-slot:footer>
<x-mail::footer>
© {{ date('Y') }} {{ config('app.name') }}. {{ __('All rights reserved.') }}
</x-mail::footer>
</x-slot:footer>
</x-mail::layout>
