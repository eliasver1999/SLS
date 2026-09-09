<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Accepting a quote.
 *
 * There was no way to say yes. The only affirmative button on a quote was
 * "Order this again", which refilled the basket and submitted a new request
 * — and new lines are always repriced from the catalogue, so the rate the
 * team had negotiated was silently discarded. A customer accepting a
 * 68,200 quote placed an 85,560 order, and nobody was told.
 *
 * The price surviving acceptance is therefore what most of this file is
 * about.
 */
class QuoteAcceptanceTest extends TestCase
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

    /** A quote already priced by the team, below list. */
    private function quotedQuote(User $owner, int $agreedCents = 550000, array $attributes = []): Order
    {
        $order = Order::create([
            'user_id' => $owner->id,
            'reference' => 'SLS-Q-2001',
            'type' => 'quote',
            'status' => 'quoted',
            'contact_name' => $owner->name,
            'contact_email' => $owner->email,
            'company' => 'Nova Events',
            'items' => [[
                'slug' => 'aurora-p26',
                'name' => 'Aurora P2.6',
                'mode' => 'buy',
                'qty' => 10,
                'unit_price_cents' => $agreedCents,
            ]],
            'status_history' => [],
            ...$attributes,
        ]);
        $order->recalculateTotals();
        $order->save();

        return $order->fresh();
    }

    private function member(): User
    {
        return User::factory()->create(['status' => 'approved']);
    }

    public function test_accepting_keeps_the_negotiated_price(): void
    {
        // The bug in one assertion: list is 6,900 a panel, the team agreed
        // 5,500. Accepting must not quietly restore list.
        $this->product(690000);
        $member = $this->member();
        $quote = $this->quotedQuote($member, 550000, ['event_date' => '2026-11-20', 'venue' => 'Technopolis']);
        $agreedTotal = $quote->total_cents;

        Sanctum::actingAs($member);
        $this->postJson("/api/orders/{$quote->id}/accept")->assertOk();

        $fresh = $quote->fresh();
        $this->assertSame($agreedTotal, $fresh->total_cents);
        $this->assertSame(550000, $fresh->items[0]['unit_price_cents']);
        $this->assertSame(5500000, $fresh->subtotal_cents);
    }

    public function test_accepting_turns_the_quote_into_a_confirmed_order(): void
    {
        $this->product();
        $member = $this->member();
        $quote = $this->quotedQuote($member, 550000, ['event_date' => '2026-11-20', 'venue' => 'Technopolis']);

        Sanctum::actingAs($member);
        $this->postJson("/api/orders/{$quote->id}/accept")
            ->assertOk()
            ->assertJsonPath('data.type', 'order')
            ->assertJsonPath('data.status', 'confirmed');

        // One record, not two: accepting must not leave a stray quote behind.
        $this->assertSame(1, Order::count());
    }

    public function test_the_reference_survives_acceptance(): void
    {
        // It is already on the quote email and may be on the customer's
        // purchase order, so a new identifier here would orphan both.
        $this->product();
        $member = $this->member();
        $quote = $this->quotedQuote($member, 550000, ['event_date' => '2026-11-20', 'venue' => 'Technopolis']);

        Sanctum::actingAs($member);
        $this->postJson("/api/orders/{$quote->id}/accept")->assertOk();

        $this->assertSame('SLS-Q-2001', $quote->fresh()->reference);
    }

    public function test_acceptance_is_recorded_as_the_customers_own_decision(): void
    {
        $this->product();
        $member = $this->member();
        $quote = $this->quotedQuote($member, 550000, ['event_date' => '2026-11-20', 'venue' => 'Technopolis']);

        Sanctum::actingAs($member);
        $this->postJson("/api/orders/{$quote->id}/accept")->assertOk();

        $last = collect($quote->fresh()->status_history)->last();
        $this->assertSame('confirmed', $last['status']);
        $this->assertSame('customer', $last['by_role']);
        // The amount they agreed to, in the timeline both sides can read.
        // "total" is a formatted field the API resource adds rather than a
        // model attribute, so reading it off the model silently gave "at .".
        // The VAT-inclusive total, matching what the accept panel promised.
        $this->assertStringContainsString('68,200', $last['note']);
    }

    public function test_a_quote_without_a_date_or_venue_must_supply_them(): void
    {
        // An order is committed work that has to be crewed and delivered.
        $this->product();
        $member = $this->member();
        $quote = $this->quotedQuote($member);

        Sanctum::actingAs($member);
        $this->postJson("/api/orders/{$quote->id}/accept")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['event_date', 'venue']);

        $this->postJson("/api/orders/{$quote->id}/accept", [
            'event_date' => now()->addMonth()->toDateString(),
            'venue' => 'Technopolis, Athens',
        ])->assertOk();

        $this->assertSame('Technopolis, Athens', $quote->fresh()->venue);
    }

    public function test_a_quote_with_no_price_yet_cannot_be_accepted(): void
    {
        $this->product();
        $member = $this->member();
        $quote = $this->quotedQuote($member, 550000, [
            'status' => 'pending',
            'event_date' => '2026-11-20',
            'venue' => 'Technopolis',
        ]);

        Sanctum::actingAs($member);
        $this->postJson("/api/orders/{$quote->id}/accept")->assertStatus(422);

        $this->assertSame('pending', $quote->fresh()->status);
    }

    public function test_an_order_cannot_be_accepted_again(): void
    {
        $this->product();
        $member = $this->member();
        $quote = $this->quotedQuote($member, 550000, ['event_date' => '2026-11-20', 'venue' => 'Technopolis']);

        Sanctum::actingAs($member);
        $this->postJson("/api/orders/{$quote->id}/accept")->assertOk();
        $this->postJson("/api/orders/{$quote->id}/accept")->assertStatus(422);
    }

    public function test_a_member_cannot_accept_someone_elses_quote(): void
    {
        $this->product();
        $quote = $this->quotedQuote($this->member(), 550000, ['event_date' => '2026-11-20', 'venue' => 'Technopolis']);

        Sanctum::actingAs($this->member());
        $this->postJson("/api/orders/{$quote->id}/accept")->assertForbidden();

        $this->assertSame('quote', $quote->fresh()->type);
    }

    public function test_a_guest_cannot_accept_a_quote(): void
    {
        $this->product();
        $quote = $this->quotedQuote($this->member(), 550000, ['event_date' => '2026-11-20', 'venue' => 'Technopolis']);

        $this->postJson("/api/orders/{$quote->id}/accept")->assertUnauthorized();
    }

    public function test_the_team_sees_the_acceptance_in_the_activity_feed(): void
    {
        // Committed work has appeared; the team cannot be left relying on an
        // email to find out about it.
        $this->product();
        $member = $this->member();
        $quote = $this->quotedQuote($member, 550000, ['event_date' => '2026-11-20', 'venue' => 'Technopolis']);

        Sanctum::actingAs($member);
        $this->postJson("/api/orders/{$quote->id}/accept")->assertOk();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $event = collect($this->getJson('/api/activity')->json('data'))
            ->firstWhere('kind', 'quote.accepted');

        $this->assertNotNull($event, 'An accepted quote is invisible to the team.');
        $this->assertTrue($event['needs_action']);
        $this->assertStringContainsString('SLS-Q-2001', $event['title']);
    }
}
