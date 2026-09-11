<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * Recording money received against an order.
 *
 * Nothing here takes a payment — the site has never handled card details
 * and does not now. These are the team writing down what arrived in the
 * bank, which is what lets the application stop guessing: before this, the
 * completion email told every customer "the remaining amount is now due",
 * including the ones who had already paid in full.
 *
 * Admin only. A customer asserting their own payment would be a customer
 * clearing their own balance.
 */
class OrderPaymentController extends Controller
{
    public function store(Request $request, Order $order)
    {
        $data = $request->validate([
            // Signed, because a refund is a payment in the other direction
            // and pretending otherwise means it cannot be recorded at all.
            'amount_cents' => ['required', 'integer', 'min:-100000000', 'max:100000000', 'not_in:0'],
            // The date the money landed, which is rarely the day someone
            // got round to typing it in.
            'received_on' => ['required', 'date', 'before_or_equal:today'],
            'method' => ['nullable', Rule::in(['transfer', 'card', 'cash', 'other'])],
            'reference' => ['nullable', 'string', 'max:120'],
            'note' => ['nullable', 'string', 'max:255'],
        ], [
            'received_on.before_or_equal' => 'A payment cannot have arrived in the future.',
            'amount_cents.not_in' => 'A payment of nothing is not a payment.',
        ]);

        $payment = $order->payments()->create([
            ...$data,
            'method' => $data['method'] ?? 'transfer',
            'recorded_by' => $request->user()->id,
        ]);

        Log::info('Payment recorded', [
            'reference' => $order->reference,
            'amount' => $payment->amount_cents,
            'by' => $request->user()->id,
        ]);

        return new OrderResource($order->fresh()->load(['documents', 'payments']));
    }

    /**
     * Remove a payment recorded in error.
     *
     * Kept deliberately simple — there is no edit. Correcting an amount is
     * a delete and a re-entry, which leaves the log honest about what was
     * believed and when rather than silently rewriting history.
     */
    public function destroy(Order $order, OrderPayment $payment)
    {
        // A payment id from one order must not be reachable through
        // another order's URL.
        abort_if($payment->order_id !== $order->id, 404);

        Log::info('Payment record removed', [
            'reference' => $order->reference,
            'amount' => Money::format($payment->amount_cents, $order->currency),
        ]);

        $payment->delete();

        return new OrderResource($order->fresh()->load(['documents', 'payments']));
    }
}
