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
            'pitch_mm' => 2.6,
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

    public function test_the_catalogue_can_be_filtered_by_placement_and_pitch(): void
    {
        // The catalogue's filter sidebar used to be decorative markup, with
        // several options rendered as already applied while the grid showed
        // everything. These are the queries behind the real ones.
        $this->product(); // indoor screen at 2.6 mm

        Product::create([
            'slug' => 'titan-p39',
            'name' => 'Titan P3.9',
            'category' => 'screens',
            'placement_key' => 'outdoor',
            'pitch_mm' => 3.9,
            'image' => '/assets/x.jpg',
            'tag' => ['en' => 'Outdoor', 'el' => 'Εξωτ.'],
            'blurb' => ['en' => 'b', 'el' => 'b'],
            'thumbs' => [], 'card_specs' => [], 'spec_table' => [], 'modes' => ['buy'],
            'buy_price_cents' => 840000,
            'buy' => ['unit' => ['en' => '/p', 'el' => '/p'], 'leadTime' => ['en' => '4w', 'el' => '4w']],
            'featured' => false,
        ]);

        Product::create([
            'slug' => 'beam-380',
            'name' => 'Beam 380',
            'category' => 'lighting',
            'placement_key' => 'lighting',
            'pitch_mm' => null,
            'image' => '/assets/x.jpg',
            'tag' => ['en' => 'Lighting', 'el' => 'Φωτισμός'],
            'blurb' => ['en' => 'b', 'el' => 'b'],
            'thumbs' => [], 'card_specs' => [], 'spec_table' => [], 'modes' => ['buy'],
            'buy_price_cents' => 190000,
            'buy' => ['unit' => ['en' => '/u', 'el' => '/u'], 'leadTime' => ['en' => '2w', 'el' => '2w']],
            'featured' => false,
        ]);

        $slugs = fn (string $query) => collect($this->getJson("/api/products?{$query}")->json('data'))
            ->pluck('slug')->sort()->values()->all();

        $this->assertSame(['aurora-p26'], $slugs('placement=indoor'));
        $this->assertSame(['titan-p39'], $slugs('placement=outdoor'));
        $this->assertSame(['aurora-p26'], $slugs('pitch_min=1.5&pitch_max=2.6'));
        $this->assertSame(['titan-p39'], $slugs('pitch_min=2.9&pitch_max=3.9'));

        // A pitch range excludes anything with no pitch, which is the honest
        // answer for a lighting fixture.
        $this->assertNotContains('beam-380', $slugs('pitch_min=1.5&pitch_max=10'));

        // Filters combine rather than replace one another.
        $this->assertSame([], $slugs('placement=outdoor&pitch_min=1.5&pitch_max=2.6'));
    }

    public function test_quote_only_products_expose_no_buy_block(): void
    {
        $product = $this->product();
        $product->update(['buy' => null, 'buy_price_cents' => null, 'modes' => []]);

        $this->getJson('/api/products')->assertJsonPath('data.0.buy', null);
    }
}
