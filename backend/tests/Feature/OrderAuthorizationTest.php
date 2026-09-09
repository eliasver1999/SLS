<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Pins the access rules around orders: members see only their own, only
 * approved members can place them, only admins can change them, and the money
 * on a line always comes from the product record rather than the payload.
 */
class OrderAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function order(User $owner): Order
    {
        return Order::create([
            'user_id' => $owner->id,
            'reference' => 'SLS-O-1000',
            'type' => 'order',
            'status' => 'pending',
            'contact_name' => $owner->name,
            'contact_email' => $owner->email,
            'company' => 'Nova Events',
            'items' => [],
            'status_history' => [],
        ]);
    }

    /**
     * A payload that satisfies the order rules, so tests about authorization
     * are not also restating the event-detail requirements.
     *
     * @return array<string, mixed>
     */
    private function orderPayload(array $overrides = []): array
    {
        return array_merge([
            'type' => 'order',
            'items' => [['slug' => 'aurora-p26', 'qty' => 2]],
            'event_date' => now()->addMonth()->toDateString(),
            'venue' => 'Technopolis, Athens',
        ], $overrides);
    }

    private function product(): Product
    {
        return Product::create([
            'slug' => 'aurora-p26',
            'name' => 'Aurora P2.6',
            'category' => 'screens',
            'placement_key' => 'indoor',
            'image' => '/assets/led-wall.jpg',
            'tag' => ['en' => 'Indoor', 'el' => 'Εσωτ.'],
            'blurb' => ['en' => 'Wall', 'el' => 'Wall'],
            'thumbs' => [],
            'card_specs' => [],
            'spec_table' => [],
            'modes' => ['buy'],
            'buy_price_cents' => 690000,
            'buy' => [
                'unit' => ['en' => '/ panel', 'el' => '/ panel'],
                'leadTime' => ['en' => '3 weeks', 'el' => '3 εβδομάδες'],
            ],
            'featured' => false,
        ]);
    }

    public function test_a_member_cannot_read_another_members_order(): void
    {
        $order = $this->order(User::factory()->create(['status' => 'approved']));
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->getJson("/api/orders/{$order->id}")->assertForbidden();
    }

    public function test_a_member_can_read_their_own_order(): void
    {
        $owner = User::factory()->create(['status' => 'approved']);
        $order = $this->order($owner);
        Sanctum::actingAs($owner);

        $this->getJson("/api/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.reference', 'SLS-O-1000');
    }

    public function test_an_admin_can_read_any_order(): void
    {
        $order = $this->order(User::factory()->create(['status' => 'approved']));
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->getJson("/api/orders/{$order->id}")->assertOk();
    }

    public function test_a_member_cannot_change_an_order_status(): void
    {
        $owner = User::factory()->create(['status' => 'approved']);
        $order = $this->order($owner);
        Sanctum::actingAs($owner);

        // Status is admin-only even on the member's own order.
        $this->patchJson("/api/orders/{$order->id}", ['status' => 'completed'])->assertForbidden();
        $this->assertSame('pending', $order->fresh()->status);
    }

    public function test_a_pending_member_cannot_place_an_order(): void
    {
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'pending']));

        // Valid payload, so this proves the block is about approval and not
        // about a missing field.
        $this->postJson('/api/orders', $this->orderPayload())->assertForbidden();

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_an_approved_member_can_place_an_order(): void
    {
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->postJson('/api/orders', $this->orderPayload())->assertCreated();

        $this->assertDatabaseCount('orders', 1);
    }

    public function test_a_client_supplied_price_is_ignored(): void
    {
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->postJson('/api/orders', $this->orderPayload([
            'items' => [['slug' => 'aurora-p26', 'qty' => 1, 'unit_price_cents' => 1]],
        ]))->assertCreated();

        // The line is rebuilt from the product, so the tampered price is dropped.
        $this->assertSame(690000, Order::first()->items[0]['unit_price_cents']);
    }

    public function test_an_order_must_say_when_and_where(): void
    {
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        // Event tech is delivered to a place on a date; without them the team
        // has to chase the customer before they can quote or schedule.
        $this->postJson('/api/orders', [
            'type' => 'order',
            'items' => [['slug' => 'aurora-p26', 'qty' => 2]],
        ])->assertStatus(422)->assertJsonValidationErrors(['event_date', 'venue']);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_there_is_no_quote_route_that_skips_the_event_details(): void
    {
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        // This used to be allowed: a "quote" was exploratory and needed no
        // venue. That route is gone — the storefront has one door, everything
        // through it is an order, and an order is work that has to be crewed
        // and delivered. Asking for a price without a date is what the
        // contact form is for.
        $this->postJson('/api/orders', [
            'type' => 'quote',
            'items' => [['slug' => 'aurora-p26', 'qty' => 2]],
        ])->assertStatus(422)->assertJsonValidationErrors(['event_date', 'venue']);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_an_order_rejects_an_event_date_in_the_past(): void
    {
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->postJson('/api/orders', [
            'type' => 'order',
            'items' => [['slug' => 'aurora-p26', 'qty' => 2]],
            'event_date' => now()->subDay()->toDateString(),
            'venue' => 'Technopolis, Athens',
        ])->assertStatus(422)->assertJsonValidationErrors(['event_date']);
    }

    public function test_event_details_are_stored_and_returned(): void
    {
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $date = now()->addMonth()->toDateString();

        $this->postJson('/api/orders', [
            'type' => 'order',
            'items' => [['slug' => 'aurora-p26', 'qty' => 2]],
            'event_type' => 'Festival main stage',
            'event_date' => $date,
            'venue' => 'Technopolis, Athens',
            'delivery_address' => 'Pireos 100, loading bay B',
        ])->assertCreated()
            ->assertJsonPath('data.event_type', 'Festival main stage')
            ->assertJsonPath('data.event_date', $date)
            ->assertJsonPath('data.venue', 'Technopolis, Athens')
            ->assertJsonPath('data.delivery_address', 'Pireos 100, loading bay B');
    }

    public function test_guests_cannot_touch_orders(): void
    {
        $order = $this->order(User::factory()->create(['status' => 'approved']));

        $this->getJson('/api/orders')->assertUnauthorized();
        $this->getJson("/api/orders/{$order->id}")->assertUnauthorized();
        $this->postJson('/api/orders', [])->assertUnauthorized();
    }
}
