<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Recording money received.
 *
 * The application knew what was *due* and had no idea what had *arrived*,
 * so the completion email asked every customer for the balance — including
 * the ones who had already paid — and "who owes us money?" could only be
 * answered from a bank statement.
 */
class OrderPaymentTest extends TestCase
{
    use RefreshDatabase;

    /** A confirmed order for 10 panels: 85,560 inc VAT, so a 42,780 deposit. */
    private function order(string $status = 'confirmed'): Order
    {
        $order = Order::create([
            'user_id' => User::factory()->create(['status' => 'approved'])->id,
            'reference' => 'SLS-O-'.fake()->unique()->numberBetween(2000, 9999),
            'type' => 'order',
            'status' => $status,
            'contact_name' => 'Maria Papadopoulou',
            'contact_email' => 'maria@novaevents.gr',
            'items' => [['slug' => 'aurora-p26', 'name' => 'Aurora P2.6', 'qty' => 10, 'unit_price_cents' => 690000]],
            'status_history' => [],
        ]);
        $order->recalculateTotals();
        $order->save();

        return $order->fresh();
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function record(Order $order, int $cents, array $extra = []): array
    {
        Sanctum::actingAs($this->admin());

        return $this->postJson("/api/orders/{$order->id}/payments", [
            'amount_cents' => $cents,
            'received_on' => now()->subDay()->toDateString(),
            ...$extra,
        ])->assertOk()->json('data.payment');
    }

    public function test_recording_a_payment_reduces_what_is_outstanding(): void
    {
        $order = $this->order();

        $payment = $this->record($order, 4278000);

        $this->assertSame(4278000, $payment['paid_cents']);
        $this->assertSame(4278000, $payment['outstanding_cents']);
        $this->assertFalse($payment['settled']);
    }

    public function test_paying_the_deposit_stops_the_deposit_being_chased(): void
    {
        $order = $this->order();

        $payment = $this->record($order, 4278000);

        // The deposit is settled; the balance is not due until completion.
        $this->assertNull($payment['due']);
    }

    public function test_a_part_payment_still_chases_the_rest_of_the_deposit(): void
    {
        $order = $this->order();

        $payment = $this->record($order, 1000000);

        $this->assertSame('deposit', $payment['due']);
        // Only the shortfall, not the whole deposit again.
        $this->assertSame(3278000, $payment['due_cents']);
    }

    public function test_paying_in_full_settles_the_order(): void
    {
        $order = $this->order('completed');

        $payment = $this->record($order, 8556000);

        $this->assertTrue($payment['settled']);
        $this->assertNull($payment['due']);
        $this->assertSame(0, $payment['outstanding_cents']);
    }

    public function test_a_completed_order_chases_only_what_is_left(): void
    {
        $order = $this->order('completed');
        $this->record($order, 4278000);

        Sanctum::actingAs($this->admin());
        $payment = $this->getJson("/api/orders/{$order->id}")->json('data.payment');

        $this->assertSame('balance', $payment['due']);
        $this->assertSame(4278000, $payment['due_cents']);
    }

    public function test_several_payments_add_up(): void
    {
        // People pay in instalments; a boolean "deposit paid" could not
        // represent this at all.
        $order = $this->order();
        $this->record($order, 1000000);
        $this->record($order, 2000000);
        $payment = $this->record($order, 1278000);

        $this->assertSame(4278000, $payment['paid_cents']);
        $this->assertCount(3, $payment['received']);
    }

    public function test_a_refund_can_be_recorded(): void
    {
        $order = $this->order();
        $this->record($order, 4278000);

        $payment = $this->record($order, -278000, ['note' => 'Partial refund, one panel short.']);

        $this->assertSame(4000000, $payment['paid_cents']);
    }

    public function test_an_overpayment_never_shows_a_negative_balance(): void
    {
        // A credit is something to sort out with the customer, not a
        // negative demand on their order page.
        $order = $this->order();

        $payment = $this->record($order, 9000000);

        $this->assertSame(0, $payment['outstanding_cents']);
        $this->assertTrue($payment['settled']);
    }

    public function test_a_payment_cannot_be_dated_in_the_future(): void
    {
        $order = $this->order();
        Sanctum::actingAs($this->admin());

        $this->postJson("/api/orders/{$order->id}/payments", [
            'amount_cents' => 1000,
            'received_on' => now()->addWeek()->toDateString(),
        ])->assertStatus(422)->assertJsonValidationErrors(['received_on']);
    }

    public function test_a_payment_of_nothing_is_rejected(): void
    {
        $order = $this->order();
        Sanctum::actingAs($this->admin());

        $this->postJson("/api/orders/{$order->id}/payments", [
            'amount_cents' => 0,
            'received_on' => now()->toDateString(),
        ])->assertStatus(422)->assertJsonValidationErrors(['amount_cents']);
    }

    public function test_a_customer_cannot_record_their_own_payment(): void
    {
        // Otherwise a customer can clear their own balance.
        $order = $this->order();
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->postJson("/api/orders/{$order->id}/payments", [
            'amount_cents' => 8556000,
            'received_on' => now()->toDateString(),
        ])->assertForbidden();

        $this->assertSame(0, $order->fresh()->paidCents());
    }

    public function test_a_payment_recorded_in_error_can_be_removed(): void
    {
        $order = $this->order();
        $this->record($order, 4278000);
        $id = $order->fresh()->payments->first()->id;

        Sanctum::actingAs($this->admin());
        $this->deleteJson("/api/orders/{$order->id}/payments/{$id}")
            ->assertOk()
            ->assertJsonPath('data.payment.paid_cents', 0);
    }

    public function test_a_payment_cannot_be_removed_through_another_order(): void
    {
        $order = $this->order();
        $other = $this->order();
        $this->record($order, 4278000);
        $id = $order->fresh()->payments->first()->id;

        Sanctum::actingAs($this->admin());
        $this->deleteJson("/api/orders/{$other->id}/payments/{$id}")->assertNotFound();

        $this->assertSame(4278000, $order->fresh()->paidCents());
    }

    public function test_the_customer_can_see_what_we_have_recorded(): void
    {
        // They should not have to take the outstanding figure on trust.
        $order = $this->order();
        $this->record($order, 4278000, ['reference' => 'NBG-88412']);

        Sanctum::actingAs($order->user);
        $received = $this->getJson("/api/orders/{$order->id}")->json('data.payment.received');

        $this->assertCount(1, $received);
        $this->assertSame('NBG-88412', $received[0]['reference']);
    }
}
