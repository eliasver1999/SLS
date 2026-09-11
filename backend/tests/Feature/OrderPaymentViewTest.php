<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use App\Services\TransactionalMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * What the order page is allowed to say about money.
 *
 * The confirmation email asks for a deposit and the completion email asks
 * for the balance, but the order page said neither — so the email was the
 * only place the amount and the payment reference existed, which is exactly
 * the thing someone cannot find again three weeks later.
 */
class OrderPaymentViewTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: Order} */
    private function order(string $status): array
    {
        $member = User::factory()->create(['status' => 'approved']);

        $order = Order::create([
            'user_id' => $member->id,
            'reference' => 'SLS-O-'.fake()->unique()->numberBetween(2000, 9999),
            'type' => 'order',
            'status' => $status,
            'contact_name' => $member->name,
            'contact_email' => $member->email,
            'items' => [['slug' => 'aurora-p26', 'name' => 'Aurora P2.6', 'qty' => 10, 'unit_price_cents' => 690000]],
            'status_history' => [],
        ]);
        $order->recalculateTotals();
        $order->save();

        return [$member, $order->fresh()];
    }

    private function payment(string $status): array
    {
        [$member, $order] = $this->order($status);
        Sanctum::actingAs($member);

        return $this->getJson("/api/orders/{$order->id}")->assertOk()->json('data.payment');
    }

    public function test_nothing_is_due_before_the_team_accepts_the_order(): void
    {
        // Asking for money on a request nobody has agreed to would be the
        // page contradicting the email it has not sent yet.
        $payment = $this->payment('pending');

        $this->assertNull($payment['due']);
        $this->assertNull($payment['iban']);
    }

    public function test_an_order_awaiting_the_customers_approval_asks_for_nothing(): void
    {
        $payment = $this->payment('quoted');

        $this->assertNull($payment['due']);
        $this->assertNull($payment['iban']);
    }

    public function test_an_accepted_order_asks_for_the_deposit(): void
    {
        $payment = $this->payment('confirmed');

        $this->assertSame('deposit', $payment['due']);
        $this->assertSame(4278000, $payment['deposit_cents']);
        // The reference and the account, because a transfer without a
        // reference is a payment the team cannot match to a job.
        $this->assertStringStartsWith('SLS-O-', $payment['reference']);
        $this->assertSame(config('sls.iban'), $payment['iban']);
    }

    public function test_a_completed_order_asks_for_the_balance(): void
    {
        $payment = $this->payment('completed');

        $this->assertSame('balance', $payment['due']);
        $this->assertSame(4278000, $payment['balance_cents']);
    }

    public function test_a_cancelled_order_asks_for_nothing(): void
    {
        $payment = $this->payment('cancelled');

        $this->assertNull($payment['due']);
        $this->assertNull($payment['iban']);
    }

    public function test_the_two_instalments_add_up_to_the_total(): void
    {
        [$member, $order] = $this->order('confirmed');
        Sanctum::actingAs($member);

        $data = $this->getJson("/api/orders/{$order->id}")->json('data');

        $this->assertSame(
            $data['total_cents'],
            $data['payment']['deposit_cents'] + $data['payment']['balance_cents'],
        );
    }

    public function test_the_page_and_the_email_quote_the_same_deposit(): void
    {
        // They are derived from one place precisely so they cannot drift.
        [$member, $order] = $this->order('confirmed');
        Sanctum::actingAs($member);

        $fromApi = $this->getJson("/api/orders/{$order->id}")->json('data.payment.deposit_cents');

        $this->assertSame(TransactionalMail::depositCents($order), $fromApi);
    }
}
