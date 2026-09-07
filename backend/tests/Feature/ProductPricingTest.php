<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Net pricing is what the B2B tier sells, so it must never leave the API for
 * guests or still-pending accounts. Hiding it in CSS is not gating — these
 * tests pin the server-side behaviour so a refactor cannot quietly undo it.
 */
class ProductPricingTest extends TestCase
{
    use RefreshDatabase;

    private function product(): Product
    {
        return Product::create([
            'slug' => 'aurora-p26',
            'name' => 'Aurora P2.6',
            'category' => 'screens',
            'placement_key' => 'indoor',
            'image' => '/assets/led-wall.jpg',
            'tag' => ['en' => 'Indoor', 'el' => 'Εσωτ.'],
            'blurb' => ['en' => 'Fine-pitch wall', 'el' => 'Video wall'],
            'thumbs' => [],
            'card_specs' => [],
            'spec_table' => [],
            'modes' => ['buy'],
            'buy_price_cents' => 690000,
            'buy' => [
                'unit' => ['en' => '/ panel', 'el' => '/ panel'],
                'leadTime' => ['en' => '3–4 weeks', 'el' => '3–4 εβδομάδες'],
            ],
            'featured' => true,
        ]);
    }

    public function test_guests_do_not_receive_the_list_price(): void
    {
        $this->product();

        $response = $this->getJson('/api/products');

        $response->assertOk();
        $response->assertJsonMissingPath('data.0.buy.price');
    }

    public function test_guests_still_receive_lead_time_and_specs(): void
    {
        $this->product();

        $response = $this->getJson('/api/products');

        // Specs stay public — only the price is privileged.
        $response->assertJsonPath('data.0.name', 'Aurora P2.6');
        $response->assertJsonPath('data.0.buy.leadTime.en', '3–4 weeks');
    }

    public function test_pending_members_do_not_receive_the_list_price(): void
    {
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'pending']));

        $this->getJson('/api/products')->assertJsonMissingPath('data.0.buy.price');
    }

    public function test_rejected_members_do_not_receive_the_list_price(): void
    {
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'rejected']));

        $this->getJson('/api/products')->assertJsonMissingPath('data.0.buy.price');
    }

    public function test_approved_members_receive_the_list_price(): void
    {
        $this->product();
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->getJson('/api/products')->assertJsonPath('data.0.buy.price', '€ 6,900');
    }

    public function test_admins_receive_the_list_price(): void
    {
        $this->product();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'status' => 'pending']));

        // Admins count as approved regardless of member status.
        $this->getJson('/api/products')->assertJsonPath('data.0.buy.price', '€ 6,900');
    }

    public function test_the_single_product_endpoint_is_gated_too(): void
    {
        $product = $this->product();

        $this->getJson("/api/products/{$product->slug}")
            ->assertOk()
            ->assertJsonMissingPath('data.buy.price');

        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->getJson("/api/products/{$product->slug}")
            ->assertJsonPath('data.buy.price', '€ 6,900');
    }

    public function test_quote_only_products_expose_no_buy_block(): void
    {
        $product = $this->product();
        $product->update(['buy' => null, 'buy_price_cents' => null, 'modes' => []]);

        $this->getJson('/api/products')->assertJsonPath('data.0.buy', null);
    }
}
