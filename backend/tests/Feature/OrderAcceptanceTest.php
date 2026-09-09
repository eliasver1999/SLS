<?php

namespace Tests\Feature;

use App\Mail\TemplatedMail;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * One door in, and who has to agree to what.
 *
 * The storefront used to offer "Request a quote" and "Submit as an order" as
 * separate routes into the same process — both arrived as an unpriced
 * request the team priced and confirmed — which asked the customer to guess
 * at our internal workflow.
 *
 * Now a customer places an order at the prices they can see and the team
 * accepts it. The team may discount freely, because nobody disputes paying
 * less. The one thing the system will not do is confirm a total higher than
 * the customer agreed to without going back to them.
 */
class OrderAcceptanceTest extends TestCase
{
    use RefreshDatabase;

    private function product(int $listPriceCents = 690000): Product
    {
        return Product::create([
            'slug' => 'aurora-p26',
            'name' => 'Aurora P2.6',
            'category' => 'screens',
            'placement_key' => 'indoor',
            'image' => '/assets/led-wall.jpg',
            'tag' => ['en' => 'Indoor', 'el' => 'Indoor'],
            'blurb' => ['en' => 'Wall', 'el' => 'Wall'],
            'thumbs' => [],
            'card_specs' => [],
            'spec_table' => [],
            'modes' => ['buy'],
            'buy_price_cents' => $listPriceCents,
            'buy' => [
                'unit' => ['en' => '/ panel', 'el' => '/ panel'],
                'leadTime' => ['en' => '3 weeks', 'el' => '3 weeks'],
            ],
            'featured' => false,
        ]);
    }

    /** @return array{0: User, 1: Order} */
    private function placedOrder(int $qty = 10): array
    {
        $this->product();
        $member = User::factory()->create(['status' => 'approved']);

        Sanctum::actingAs($member);
        $response = $this->postJson('/api/orders', [
            'items' => [['slug' => 'aurora-p26', 'qty' => $qty]],
            'event_date' => now()->addMonth()->toDateString(),
            'venue' => 'Technopolis, Athens',
        ])->assertCreated();

        return [$member, Order::find($response->json('data.id'))];
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_a_customer_no_longer_chooses_between_a_quote_and_an_order(): void
    {
        [, $order] = $this->placedOrder();

        // Everything that comes through the door is an order, whatever the
        // client asks for.
        $this->assertSame('order', $order->type);
        $this->assertStringStartsWith('SLS-O-', $order->reference);
        $this->assertSame('pending', $order->status);
    }

    public function test_the_type_cannot_be_forced_by_the_client(): void
    {
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->postJson('/api/orders', [
            'type' => 'quote',
            'items' => [['slug' => 'aurora-p26', 'qty' => 1]],
            'event_date' => now()->addMonth()->toDateString(),
            'venue' => 'Technopolis',
        ])->assertCreated()->assertJsonPath('data.type', 'order');
    }

    public function test_an_order_still_needs_a_date_and_a_venue(): void
    {
        // It used to be required only for the "order" route. With one door,
        // it is required always: this is committed work that needs crew.
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->postJson('/api/orders', ['items' => [['slug' => 'aurora-p26', 'qty' => 1]]])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['event_date', 'venue']);
    }

    public function test_what_the_customer_agreed_to_is_recorded(): void
    {
        [, $order] = $this->placedOrder();

        $this->assertSame(6900000, $order->subtotal_cents);
        $this->assertSame($order->total_cents, $order->agreed_total_cents);
    }

    public function test_the_team_can_discount_and_accept_in_one_step(): void
    {
        // The everyday case. A lower price needs no further agreement, so it
        // confirms immediately.
        [, $order] = $this->placedOrder();
        Sanctum::actingAs($this->admin());

        $this->patchJson("/api/orders/{$order->id}", [
            'status' => 'confirmed',
            'items' => [[
                'slug' => 'aurora-p26', 'name' => 'Aurora P2.6', 'qty' => 10,
                'unit_price_cents' => 550000,
            ]],
            'note' => 'Agreed rate for November.',
        ])->assertOk()->assertJsonPath('data.status', 'confirmed');

        $fresh = $order->fresh();
        $this->assertSame(5500000, $fresh->subtotal_cents);
        $this->assertLessThan($fresh->agreed_total_cents, $fresh->total_cents);
    }

    public function test_a_discount_line_also_confirms_immediately(): void
    {
        [, $order] = $this->placedOrder();
        Sanctum::actingAs($this->admin());

        $this->patchJson("/api/orders/{$order->id}", [
            'status' => 'confirmed',
            'items' => [
                ['slug' => 'aurora-p26', 'name' => 'Aurora P2.6', 'qty' => 10, 'unit_price_cents' => 690000],
                ['slug' => 'aurora-p26', 'name' => 'Volume discount', 'qty' => 1, 'unit_price_cents' => -300000],
            ],
        ])->assertOk()->assertJsonPath('data.status', 'confirmed');

        $this->assertSame(6600000, $order->fresh()->subtotal_cents);
    }

    public function test_a_price_rise_cannot_be_confirmed_behind_the_customers_back(): void
    {
        // The whole reason agreed_total_cents exists. Confirming here would
        // commit the customer to a figure they have never seen.
        [, $order] = $this->placedOrder();
        Sanctum::actingAs($this->admin());

        $this->patchJson("/api/orders/{$order->id}", [
            'status' => 'confirmed',
            'items' => [[
                'slug' => 'aurora-p26', 'name' => 'Aurora P2.6', 'qty' => 10,
                'unit_price_cents' => 800000,
            ]],
            'note' => 'Rigging is heavier than we thought.',
        ])->assertOk()
            // Diverted, not confirmed: it now waits on the customer.
            ->assertJsonPath('data.status', 'quoted');

        $this->assertSame('quoted', $order->fresh()->status);
    }

    public function test_the_customer_approves_the_higher_price_and_it_confirms(): void
    {
        [$member, $order] = $this->placedOrder();

        Sanctum::actingAs($this->admin());
        $this->patchJson("/api/orders/{$order->id}", [
            'status' => 'confirmed',
            'items' => [['slug' => 'aurora-p26', 'name' => 'Aurora P2.6', 'qty' => 10, 'unit_price_cents' => 800000]],
        ])->assertOk();

        Sanctum::actingAs($member);
        $this->postJson("/api/orders/{$order->id}/accept")
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');

        $fresh = $order->fresh();
        // The new figure becomes the agreed one, so a later change is
        // measured against what they actually said yes to.
        $this->assertSame($fresh->total_cents, $fresh->agreed_total_cents);
        $this->assertSame(8000000, $fresh->subtotal_cents);

        $last = collect($fresh->status_history)->last();
        $this->assertSame('customer', $last['by_role']);
    }

    public function test_a_customer_cannot_approve_an_order_that_is_not_waiting_on_them(): void
    {
        [$member, $order] = $this->placedOrder();

        Sanctum::actingAs($member);
        $this->postJson("/api/orders/{$order->id}/accept")->assertStatus(422);

        $this->assertSame('pending', $order->fresh()->status);
    }

    public function test_a_customer_still_cannot_set_their_own_price(): void
    {
        // Discounting is the team's to give. The client's numbers are ignored
        // on the way in, as they always were.
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->postJson('/api/orders', [
            'items' => [['slug' => 'aurora-p26', 'qty' => 1, 'unit_price_cents' => 1]],
            'event_date' => now()->addMonth()->toDateString(),
            'venue' => 'Technopolis',
        ])->assertCreated()->assertJsonPath('data.subtotal_cents', 690000);
    }

    public function test_accepting_emails_the_customer(): void
    {
        Mail::fake();

        [, $order] = $this->placedOrder();
        Sanctum::actingAs($this->admin());

        $this->patchJson("/api/orders/{$order->id}", ['status' => 'confirmed'])->assertOk();

        // The customer hears that their order was accepted rather than
        // wondering whether it arrived.
        Mail::assertSent(TemplatedMail::class);
    }
}
