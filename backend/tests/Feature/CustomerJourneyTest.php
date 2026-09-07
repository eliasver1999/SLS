<?php

namespace Tests\Feature;

use App\Models\Inquiry;
use App\Models\Order;
use App\Models\PartnerApplication;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Walks the whole business flow in one test, in the order a real customer and
 * a real admin would hit it.
 *
 * The per-feature tests pin individual rules; this one exists to catch the
 * failures that only appear when the pieces are joined up — a field captured
 * on one screen and dropped on the next, pricing that unlocks but does not
 * reach the order, an email that stops firing because a status name moved.
 */
class CustomerJourneyTest extends TestCase
{
    use RefreshDatabase;

    private function catalogue(): void
    {
        $products = [
            ['aurora-p26', 'Aurora P2.6', 'screens', 690000],
            ['beam-380', 'Beam 380', 'lighting', 190000],
            ['stage-kit-s', 'Stage Kit S', 'sound', null],
        ];

        foreach ($products as [$slug, $name, $category, $cents]) {
            Product::create([
                'slug' => $slug,
                'name' => $name,
                'category' => $category,
                'placement_key' => 'indoor',
                'image' => "/assets/{$slug}.jpg",
                'tag' => ['en' => 'Indoor', 'el' => 'Εσωτ.'],
                'blurb' => ['en' => 'Blurb', 'el' => 'Blurb'],
                'thumbs' => [],
                'card_specs' => [],
                'spec_table' => [],
                'modes' => $cents ? ['buy'] : [],
                'buy_price_cents' => $cents,
                'buy' => $cents
                    ? ['unit' => ['en' => '/ unit', 'el' => '/ unit'], 'leadTime' => ['en' => '3w', 'el' => '3w']]
                    : null,
                'featured' => true,
            ]);
        }
    }

    public function test_the_whole_flow_from_first_visit_to_a_completed_order(): void
    {
        Mail::fake();
        $this->catalogue();

        // ── 1. A guest can see the catalogue but not the pricing ──────
        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonMissingPath('data.0.buy.price');

        // ── 2. They register, and are pending until an admin says so ──
        $register = $this->postJson('/api/register', [
            'name' => 'Dimitris Kostas',
            'email' => 'dimitris@bigfest.gr',
            'password' => 'a-strong-password',
            'company' => 'BigFest Productions',
            'vat_number' => 'EL999888777',
        ])->assertCreated();

        $register->assertJsonPath('user.status', 'pending')
            ->assertJsonPath('user.approved', false)
            ->assertJsonPath('user.vat_number', 'EL999888777');

        $member = User::where('email', 'dimitris@bigfest.gr')->firstOrFail();

        // Pending is not approved: still no pricing, and no ordering.
        Sanctum::actingAs($member);
        $this->getJson('/api/products')->assertJsonMissingPath('data.0.buy.price');
        $this->postJson('/api/orders', [
            'type' => 'order',
            'items' => [['slug' => 'aurora-p26', 'qty' => 4]],
            'event_date' => now()->addMonth()->toDateString(),
            'venue' => 'Technopolis',
        ])->assertForbidden();

        // ── 3. An admin approves them ─────────────────────────────────
        $admin = User::factory()->create(['role' => 'admin', 'name' => 'SLS Admin']);
        Sanctum::actingAs($admin);

        $this->patchJson("/api/users/{$member->id}", ['status' => 'approved'])->assertOk();
        $this->assertSame('approved', $member->fresh()->status);

        // ── 4. Now pricing is visible ─────────────────────────────────
        Sanctum::actingAs($member->fresh());
        $this->getJson('/api/products')->assertJsonPath('data.0.buy.price', '€ 6,900');

        // ── 5. They submit a multi-category order with event details ──
        $eventDate = now()->addMonths(2)->toDateString();

        $placed = $this->postJson('/api/orders', [
            'type' => 'order',
            'items' => [
                ['slug' => 'aurora-p26', 'qty' => 12, 'configuration' => '4 × 3 panels'],
                ['slug' => 'beam-380', 'qty' => 8],
            ],
            'event_type' => 'Festival main stage',
            'event_date' => $eventDate,
            'venue' => 'Technopolis, Athens',
            'delivery_address' => 'Pireos 100, loading bay B',
            'notes' => 'Load-in from 07:00.',
        ])->assertCreated();

        // Money is computed from the catalogue, not the payload:
        // 12 × 6,900 + 8 × 1,900 = 82,800 + 15,200 = 98,000; +24% = 121,520
        $placed->assertJsonPath('data.subtotal_cents', 9800000)
            ->assertJsonPath('data.total_cents', 12152000)
            ->assertJsonPath('data.vat_percent', 24)
            ->assertJsonPath('data.items.0.configuration', '4 × 3 panels')
            ->assertJsonPath('data.event_date', $eventDate)
            ->assertJsonPath('data.venue', 'Technopolis, Athens')
            // VAT number carried from the account onto the order for invoicing.
            ->assertJsonPath('data.vat_number', 'EL999888777');

        $order = Order::firstOrFail();
        $this->assertStringStartsWith('SLS-O-', $order->reference);

        // ── 6. Another customer cannot read it ────────────────────────
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));
        $this->getJson("/api/orders/{$order->id}")->assertForbidden();

        // ── 7. The admin reprices a line; totals follow the lines ─────
        Sanctum::actingAs($admin);
        $this->patchJson("/api/orders/{$order->id}", [
            'status' => 'quoted',
            'note' => 'Quote attached — valid 30 days.',
            'items' => [
                ['slug' => 'aurora-p26', 'name' => 'Aurora P2.6', 'qty' => 12, 'unit_price_cents' => 650000],
                ['slug' => 'beam-380', 'name' => 'Beam 380', 'qty' => 8, 'unit_price_cents' => 190000],
            ],
        ])->assertOk()
            // 12 × 6,500 + 8 × 1,900 = 78,000 + 15,200 = 93,200
            ->assertJsonPath('data.subtotal_cents', 9320000)
            ->assertJsonPath('data.subtotal', '€ 93,200');

        // ── 8. Through the lifecycle to completion ────────────────────
        foreach (['confirmed', 'in_production', 'completed'] as $status) {
            $this->patchJson("/api/orders/{$order->id}", ['status' => $status])
                ->assertOk()
                ->assertJsonPath('data.status', $status);
        }

        // Every step is on the audit trail, attributed and timestamped.
        $history = collect($order->fresh()->status_history);
        $this->assertSame(
            ['pending', 'quoted', 'confirmed', 'in_production', 'completed'],
            $history->pluck('status')->all(),
        );
        $this->assertSame('Quote attached — valid 30 days.', $history[1]['note']);

        // ── 9. It shows in reporting, ex VAT ──────────────────────────
        $this->getJson('/api/reports/orders')
            ->assertOk()
            ->assertJsonPath('headline.won_cents', 9320000)
            ->assertJsonPath('headline.won', '€ 93,200');

        // ── 10. The customer can read their own finished order ────────
        Sanctum::actingAs($member->fresh());
        $this->getJson("/api/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.total', '€ 115,568');
    }

    public function test_a_contact_enquiry_reaches_the_admin_inbox(): void
    {
        Mail::fake();

        $this->postJson('/api/inquiries', [
            'name' => 'Elena Varela',
            'email' => 'elena@corporate.gr',
            'phone' => '+30 694 555 0110',
            'event_type' => 'Corporate conference',
            'message' => 'Two-day conference for 400 people.',
        ])->assertCreated();

        $enquiry = Inquiry::firstOrFail();
        $this->assertSame('new', $enquiry->status);

        // A guest cannot read the inbox; an admin can, and can close one off.
        $this->getJson('/api/inquiries')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/api/inquiries')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Elena Varela')
            ->assertJsonPath('counts.new', 1);

        $this->patchJson("/api/inquiries/{$enquiry->id}", ['status' => 'handled'])
            ->assertOk()
            ->assertJsonPath('data.status', 'handled');
    }

    public function test_a_partner_application_carries_its_vat_number_onto_the_account(): void
    {
        Mail::fake();

        // Someone applies through the public form...
        $this->postJson('/api/partner-applications', [
            'company' => 'Aegean AV',
            'vat' => 'EL555444333',
            'contact_name' => 'Kostas Dimou',
            'email' => 'kostas@aegeanav.gr',
        ])->assertCreated();

        $this->assertDatabaseHas('partner_applications', ['vat' => 'EL555444333']);

        // ...and separately registers an account without giving a VAT number.
        $this->postJson('/api/register', [
            'name' => 'Kostas Dimou',
            'email' => 'kostas@aegeanav.gr',
            'password' => 'a-strong-password',
            'company' => 'Aegean AV',
        ])->assertCreated();

        $user = User::where('email', 'kostas@aegeanav.gr')->firstOrFail();
        $this->assertNull($user->vat_number);

        // Approving the member adopts the number from their application, so
        // the account ends up holding what an invoice needs.
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->patchJson("/api/users/{$user->id}", ['status' => 'approved'])->assertOk();

        $this->assertSame('EL555444333', $user->fresh()->vat_number);

        PartnerApplication::firstOrFail();
    }
}
