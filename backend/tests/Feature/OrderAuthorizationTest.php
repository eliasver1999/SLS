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
            'buy' => [
                'price' => '€ 6,900',
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

        $this->postJson('/api/orders', [
            'type' => 'order',
            'items' => [['slug' => 'aurora-p26', 'qty' => 2]],
        ])->assertForbidden();

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_an_approved_member_can_place_an_order(): void
    {
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->postJson('/api/orders', [
            'type' => 'order',
            'items' => [['slug' => 'aurora-p26', 'qty' => 2]],
        ])->assertCreated();

        $this->assertDatabaseCount('orders', 1);
    }

    public function test_a_client_supplied_price_is_ignored(): void
    {
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->postJson('/api/orders', [
            'type' => 'order',
            'items' => [['slug' => 'aurora-p26', 'qty' => 1, 'price' => '€ 1']],
        ])->assertCreated();

        // The line is rebuilt from the product, so the tampered price is dropped.
        $this->assertSame('€ 6,900', Order::first()->items[0]['price']);
    }

    public function test_guests_cannot_touch_orders(): void
    {
        $order = $this->order(User::factory()->create(['status' => 'approved']));

        $this->getJson('/api/orders')->assertUnauthorized();
        $this->getJson("/api/orders/{$order->id}")->assertUnauthorized();
        $this->postJson('/api/orders', [])->assertUnauthorized();
    }
}
