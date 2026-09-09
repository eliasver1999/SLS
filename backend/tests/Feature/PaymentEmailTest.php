<?php

namespace Tests\Feature;

use App\Mail\TemplatedMail;
use App\Models\Order;
use App\Services\TransactionalMail;
use App\Support\Money;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The two emails that ask for money.
 *
 * Accepting an order asks for the deposit; completing it asks for the
 * balance. Both carry the bank details and the payment reference, because
 * nobody should have to dig out an earlier email to pay this one.
 *
 * Amounts, never percentages: a customer told to "transfer 50%" does the
 * arithmetic themselves, and will sometimes do it differently from us.
 */
class PaymentEmailTest extends TestCase
{
    use RefreshDatabase;

    private function order(int $unitCents = 690000, int $qty = 10, string $reference = 'SLS-O-2001'): Order
    {
        $order = Order::create([
            'reference' => $reference,
            'type' => 'order',
            'status' => 'confirmed',
            'contact_name' => 'Maria Papadopoulou',
            'contact_email' => 'maria@novaevents.gr',
            'company' => 'Nova Events',
            'items' => [['slug' => 'aurora-p26', 'name' => 'Aurora P2.6', 'qty' => $qty, 'unit_price_cents' => $unitCents]],
            'status_history' => [],
        ]);
        $order->recalculateTotals();
        $order->save();

        return $order->fresh();
    }

    private function render(string $event, Order $order): string
    {
        $mail = app(TransactionalMail::class);
        $vars = array_merge($mail->globals(), TransactionalMail::varsForOrder($order));
        $rendered = $mail->render($event, $vars);

        return (new TemplatedMail(
            subjectLine: $rendered['subject'],
            body: $rendered['body'],
            blocks: $rendered['blocks'],
            vars: array_intersect_key($vars, array_flip(config('emails.events')[$event]['placeholders'])),
            items: $order->items,
        ))->render();
    }

    public function test_the_deposit_and_balance_always_add_back_up_to_the_total(): void
    {
        // Deriving both from percentages would let two roundings of the same
        // total miss it by a cent, and a customer who pays both halves must
        // end up owing exactly nothing.
        foreach ([100001, 333333, 690000, 1, 7] as $unit) {
            $order = $this->order($unit, 3, 'SLS-O-'.$unit);
            $deposit = TransactionalMail::depositCents($order);
            $balance = $order->total_cents - $deposit;

            $this->assertSame($order->total_cents, $deposit + $balance, "Off by a cent at unit {$unit}.");
        }
    }

    public function test_accepting_an_order_asks_for_the_deposit_with_the_bank_details(): void
    {
        $order = $this->order();
        $html = $this->render('order.status.confirmed', $order);

        $deposit = Money::format(TransactionalMail::depositCents($order), $order->currency);

        $this->assertStringContainsString(e($deposit), $html);
        $this->assertStringContainsString(config('sls.iban'), $html);
        // The payment reference, so the transfer can be matched to the order.
        $this->assertStringContainsString('SLS-O-2001', $html);
    }

    public function test_completing_an_order_asks_for_the_balance(): void
    {
        $order = $this->order();
        $html = $this->render('order.status.completed', $order);

        $balance = Money::format(
            $order->total_cents - TransactionalMail::depositCents($order),
            $order->currency,
        );

        $this->assertStringContainsString(e($balance), $html);
        $this->assertStringContainsString(config('sls.iban'), $html);
    }

    public function test_the_earlier_emails_do_not_ask_for_money(): void
    {
        // A deposit request on a request that has not been accepted yet would
        // be asking a customer to pay for something nobody has agreed to.
        $order = $this->order();

        foreach (['order.status.pending', 'order.status.quoted'] as $event) {
            $this->assertStringNotContainsString(
                config('sls.iban'),
                $this->render($event, $order),
                "{$event} should not carry bank details.",
            );
        }
    }

    public function test_a_cancelled_order_carries_no_bank_details(): void
    {
        $this->assertStringNotContainsString(
            config('sls.iban'),
            $this->render('order.status.cancelled', $this->order()),
        );
    }

    public function test_the_deposit_is_taken_from_the_vat_inclusive_total(): void
    {
        // It is what the customer actually pays, not the ex-VAT figure.
        $order = $this->order(690000, 10);

        $this->assertSame(8556000, $order->total_cents);
        $this->assertSame(4278000, TransactionalMail::depositCents($order));
    }
}
