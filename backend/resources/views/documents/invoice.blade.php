{{--
    The invoice PDF.

    Deliberately plain: this is a document someone files, prints and sends
    to an accountant, so it is legible in black and white and carries the
    fields a Greek B2B invoice needs — both VAT numbers, the rate, the
    amount of VAT, and a unique sequential number.

    Every figure comes off the invoice row rather than the live order: the
    document must say what was charged on the day it was issued.
--}}
@php
    use App\Support\Money;

    $money = fn (?int $cents) => Money::format($cents, $invoice->currency);
    $isDeposit = $invoice->kind === 'deposit';
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $invoice->number }}</title>
    <style>
        /* dompdf has no webfont here worth the weight; the built-in serif
           renders predictably at print sizes. */
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; margin: 0; }
        .head { width: 100%; margin-bottom: 26px; }
        .head td { vertical-align: top; }
        h1 { font-size: 20px; margin: 0 0 2px; letter-spacing: .5px; }
        .muted { color: #666; }
        .num { font-size: 13px; font-weight: bold; }
        table.lines { width: 100%; border-collapse: collapse; margin-top: 18px; }
        table.lines th {
            text-align: left; font-size: 9px; text-transform: uppercase;
            letter-spacing: .08em; color: #666; border-bottom: 1px solid #999;
            padding: 6px 4px;
        }
        table.lines td { padding: 7px 4px; border-bottom: 1px solid #e2e2e2; }
        .r { text-align: right; }
        table.totals { margin-left: auto; margin-top: 14px; width: 46%; border-collapse: collapse; }
        table.totals td { padding: 4px 4px; }
        table.totals tr.grand td { border-top: 1.5px solid #111; font-weight: bold; font-size: 13px; padding-top: 8px; }
        .due { margin-top: 22px; border: 1.5px solid #111; padding: 12px 14px; }
        .due .amount { font-size: 18px; font-weight: bold; }
        .pay { margin-top: 18px; font-size: 10.5px; line-height: 1.65; }
        .foot { margin-top: 30px; font-size: 9.5px; color: #666; line-height: 1.6; }
    </style>
</head>
<body>

<table class="head">
    <tr>
        <td>
            <h1>SLS</h1>
            <div class="muted">Sound · Lights · Screens</div>
            <div class="muted" style="margin-top:8px">
                {{ config('sls.account_name') }}<br>
                {{ config('sls.address') }}<br>
                @if (config('sls.vat_number'))
                    VAT: {{ config('sls.vat_number') }}<br>
                @endif
                {{ config('sls.sales_email') }}
            </div>
        </td>
        <td class="r">
            <div class="num">{{ $isDeposit ? 'Deposit invoice' : 'Final invoice' }}</div>
            <div class="num">{{ $invoice->number }}</div>
            <div class="muted" style="margin-top:8px">
                Issued: {{ $invoice->issued_on?->format('d M Y') }}<br>
                Order: {{ $order->reference }}
                @if ($order->event_date)
                    <br>Event: {{ $order->event_date->format('d M Y') }}
                @endif
            </div>
        </td>
    </tr>
</table>

<table class="head">
    <tr>
        <td>
            <div class="muted" style="font-size:9px; text-transform:uppercase; letter-spacing:.08em">Billed to</div>
            <div style="margin-top:4px">
                <strong>{{ $invoice->bill_to }}</strong><br>
                @if ($invoice->bill_to_vat)
                    VAT: {{ $invoice->bill_to_vat }}<br>
                @endif
                {{ $invoice->bill_to_email }}
            </div>
        </td>
        <td class="r">
            @if ($order->venue)
                <div class="muted" style="font-size:9px; text-transform:uppercase; letter-spacing:.08em">Venue</div>
                <div style="margin-top:4px">{{ $order->venue }}</div>
            @endif
        </td>
    </tr>
</table>

<table class="lines">
    <thead>
        <tr>
            <th>Description</th>
            <th class="r" style="width:60px">Qty</th>
            <th class="r" style="width:90px">Unit</th>
            <th class="r" style="width:100px">Amount</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($invoice->lines as $line)
            <tr>
                <td>
                    {{ $line['name'] ?? '' }}
                    @if (! empty($line['configuration']))
                        <div class="muted">{{ $line['configuration'] }}</div>
                    @endif
                </td>
                <td class="r">{{ $line['qty'] ?? 1 }}</td>
                <td class="r">{{ $money($line['unit_price_cents'] ?? 0) }}</td>
                <td class="r">{{ $money(($line['unit_price_cents'] ?? 0) * ($line['qty'] ?? 1)) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

<table class="totals">
    <tr>
        <td>Subtotal (ex VAT)</td>
        <td class="r">{{ $money($invoice->subtotal_cents) }}</td>
    </tr>
    <tr>
        <td>VAT ({{ $invoice->vat_percent }}%)</td>
        <td class="r">{{ $money($invoice->vat_cents) }}</td>
    </tr>
    <tr class="grand">
        <td>Order total</td>
        <td class="r">{{ $money($invoice->total_cents) }}</td>
    </tr>
</table>

<div class="due">
    <table style="width:100%">
        <tr>
            <td>
                <strong>{{ $isDeposit ? config('sls.deposit_percent').'% deposit now due' : 'Balance now due' }}</strong>
                <div class="muted" style="margin-top:3px">
                    @if ($isDeposit)
                        The remaining balance falls due once the job is complete.
                    @else
                        Final amount payable on this order.
                    @endif
                </div>
            </td>
            <td class="r amount">{{ $money($invoice->amount_cents) }}</td>
        </tr>
    </table>
</div>

<div class="pay">
    <strong>Payment by bank transfer</strong><br>
    Account: {{ config('sls.account_name') }}<br>
    Bank: {{ config('sls.bank_name') }}<br>
    IBAN: <strong>{{ config('sls.iban') }}</strong><br>
    {{-- Without this a transfer cannot be matched to a job. --}}
    Payment reference: <strong>{{ $order->reference }}</strong>
</div>

<div class="foot">
    All amounts in {{ $invoice->currency }}. VAT charged at {{ $invoice->vat_percent }}%.<br>
    This invoice was generated on {{ $invoice->issued_on?->format('d M Y') }} and relates to order
    {{ $order->reference }}.
</div>

</body>
</html>
