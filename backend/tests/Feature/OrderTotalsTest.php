<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Totals must always be derivable from the lines, and an order must keep the
 * VAT rate it was quoted at — a rate change cannot be allowed to silently
 * restate work that was already priced.
 */
class OrderTotalsTest extends TestCase
{
    use RefreshDatabase;

    private function product(int $cents, string $slug = 'aurora-p26'): Product
    {
        return Product::create([
            'slug' => $slug,
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
            'buy_price_cents' => $cents,
            'buy' => ['unit' => ['en' => '/ panel', 'el' => '/ panel'], 'leadTime' => ['en' => '3w', 'el' => '3w']],
            'featured' => false,
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'type' => 'order',
            'items' => [['slug' => 'aurora-p26', 'qty' => 12]],
            'event_date' => now()->addMonth()->toDateString(),
            'venue' => 'Technopolis, Athens',
        ], $overrides);
    }

    public function test_it_totals_the_lines_and_adds_vat(): void
    {
        config()->set('sls.vat_percent', 24);
        $this->product(690000); // € 6,900
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $response = $this->postJson('/api/orders', $this->payload())->assertCreated();

        // 12 × 6,900 = 82,800; +24% = 102,672
        $response->assertJsonPath('data.subtotal_cents', 8280000)
            ->assertJsonPath('data.vat_cents', 1987200)
            ->assertJsonPath('data.total_cents', 10267200)
            ->assertJsonPath('data.subtotal', '€ 82,800')
            ->assertJsonPath('data.total', '€ 102,672')
            ->assertJsonPath('data.vat_percent', 24)
            ->assertJsonPath('data.currency', 'EUR');
    }

    public function test_each_line_carries_its_own_total(): void
    {
        $this->product(690000);
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->postJson('/api/orders', $this->payload())
            ->assertJsonPath('data.items.0.unit_price_cents', 690000)
            ->assertJsonPath('data.items.0.qty', 12)
            ->assertJsonPath('data.items.0.line_total_cents', 8280000)
            ->assertJsonPath('data.items.0.line_total', '€ 82,800');
    }

    public function test_vat_rounds_to_the_nearest_cent(): void
    {
        config()->set('sls.vat_percent', 24);
        $this->product(1); // 1 cent, so 24% is 0.24 of a cent
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->postJson('/api/orders', $this->payload(['items' => [['slug' => 'aurora-p26', 'qty' => 1]]]))
            ->assertJsonPath('data.vat_cents', 0)
            ->assertJsonPath('data.total_cents', 1);
    }

    public function test_an_order_keeps_the_vat_rate_it_was_placed_under(): void
    {
        config()->set('sls.vat_percent', 24);
        $this->product(690000);
        $owner = User::factory()->create(['status' => 'approved']);
        Sanctum::actingAs($owner);

        $this->postJson('/api/orders', $this->payload())->assertCreated();
        $order = Order::first();

        // The statutory rate changes afterwards...
        config()->set('sls.vat_percent', 13);
        $order->recalculateTotals();

        // ...but this order was priced at 24% and stays there.
        $this->assertSame(24, $order->vat_percent);
        $this->assertSame(1987200, $order->vat_cents);
    }

    public function test_an_admin_cannot_set_a_total_that_disagrees_with_the_lines(): void
    {
        $this->product(690000);
        $owner = User::factory()->create(['status' => 'approved']);
        Sanctum::actingAs($owner);
        $this->postJson('/api/orders', $this->payload())->assertCreated();
        $order = Order::first();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        // A total is not an accepted field; repricing happens on the lines.
        $this->patchJson("/api/orders/{$order->id}", [
            'total' => '€ 1',
            'total_cents' => 100,
            'items' => [[
                'slug' => 'aurora-p26',
                'name' => 'Aurora P2.6',
                'qty' => 2,
                'unit_price_cents' => 500000,
            ]],
        ])->assertOk()
            ->assertJsonPath('data.subtotal_cents', 1000000)
            ->assertJsonPath('data.total_cents', 1240000);
    }

    public function test_an_admin_can_price_a_line_that_had_no_list_price(): void
    {
        $this->product(0, 'stage-kit-s');
        $owner = User::factory()->create(['status' => 'approved']);
        Sanctum::actingAs($owner);
        $this->postJson('/api/orders', $this->payload([
            'type' => 'quote',
            'items' => [['slug' => 'stage-kit-s', 'qty' => 1]],
        ]))->assertCreated();
        $order = Order::first();

        $this->assertSame(0, $order->total_cents);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->patchJson("/api/orders/{$order->id}", [
            'status' => 'quoted',
            'items' => [[
                'slug' => 'stage-kit-s',
                'name' => 'Stage Kit S',
                'qty' => 1,
                'unit_price_cents' => 580000,
            ]],
        ])->assertOk()->assertJsonPath('data.subtotal', '€ 5,800');
    }
}
