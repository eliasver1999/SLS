<?php

namespace Tests\Feature;

use App\Models\Inquiry;
use App\Models\Order;
use App\Models\PartnerApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The admin activity feed: the team's answer to "what have we missed?".
 *
 * The feed exists because a notification email that is filtered or scrolled
 * past used to mean an order nobody knew about, so the tests care most about
 * two things — that nothing is left out of the feed, and that the unread
 * count is honest about how much has arrived.
 */
class ActivityFeedTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    /**
     * There is no order factory, so this is the local equivalent — created_at
     * is settable because most of these tests are about ordering and about
     * what happened before or after a watermark.
     */
    private function order(array $attributes = []): Order
    {
        $createdAt = $attributes['created_at'] ?? null;
        unset($attributes['created_at']);

        $order = Order::create([
            'reference' => 'SLS-O-'.fake()->unique()->numberBetween(1000, 9999),
            'type' => 'order',
            'status' => 'pending',
            'contact_name' => 'Maria Papadopoulou',
            'contact_email' => 'maria@example.com',
            'company' => 'Nova Events',
            'items' => [],
            'status_history' => [],
            ...$attributes,
        ]);

        if ($createdAt !== null) {
            $order->forceFill(['created_at' => $createdAt])->saveQuietly();
        }

        return $order->fresh();
    }

    public function test_the_feed_gathers_every_kind_of_customer_activity(): void
    {
        $member = User::factory()->create(['status' => 'approved', 'company' => 'Nova Events']);

        $this->order(['type' => 'order', 'reference' => 'SLS-O-1001', 'user_id' => $member->id]);
        $this->order(['type' => 'quote', 'reference' => 'SLS-Q-2001', 'user_id' => $member->id]);
        Inquiry::create(['name' => 'Dimitris', 'email' => 'd@example.com', 'event_type' => 'Concert', 'message' => 'Hi']);
        PartnerApplication::create([
            'reference' => 'SLS-P-3001',
            'company' => 'Aegean AV',
            'contact_name' => 'Elena',
            'email' => 'e@example.com',
        ]);

        Sanctum::actingAs($this->admin());

        $kinds = collect($this->getJson('/api/activity')->assertOk()->json('data'))
            ->pluck('kind');

        // The member registration above is activity in its own right.
        foreach (['order.placed', 'quote.requested', 'inquiry.received', 'application.received', 'member.registered'] as $kind) {
            $this->assertContains($kind, $kinds, "The feed dropped {$kind}.");
        }
    }

    public function test_events_are_newest_first(): void
    {
        $this->order(['reference' => 'SLS-O-OLD', 'created_at' => now()->subDays(3)]);
        $this->order(['reference' => 'SLS-O-NEW', 'created_at' => now()->subMinute()]);

        Sanctum::actingAs($this->admin());

        $this->getJson('/api/activity')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Order placed — SLS-O-NEW');
    }

    public function test_an_untouched_request_is_flagged_as_needing_action(): void
    {
        $this->order(['reference' => 'SLS-O-1002', 'status' => 'pending']);
        $this->order(['reference' => 'SLS-O-1003', 'status' => 'completed']);

        Sanctum::actingAs($this->admin());

        $flags = collect($this->getJson('/api/activity')->json('data'))
            ->pluck('needs_action', 'title');

        $this->assertTrue($flags['Order placed — SLS-O-1002']);
        $this->assertFalse($flags['Order placed — SLS-O-1003']);
    }

    public function test_a_customer_cancelling_their_own_order_reaches_the_feed(): void
    {
        // The one customer action that is not a row of its own — it lives in
        // the order's status history — so it is the one most easily missed.
        $member = User::factory()->create(['status' => 'approved']);
        $order = $this->order([
            'reference' => 'SLS-Q-2002',
            'type' => 'quote',
            'status' => 'quoted',
            'user_id' => $member->id,
        ]);

        Sanctum::actingAs($member);
        $this->postJson("/api/orders/{$order->id}/cancel")->assertOk();

        Sanctum::actingAs($this->admin());

        $cancellation = collect($this->getJson('/api/activity')->json('data'))
            ->firstWhere('kind', 'order.cancelled');

        $this->assertNotNull($cancellation, 'A customer cancellation is invisible to the team.');
        $this->assertSame('Cancelled by customer — SLS-Q-2002', $cancellation['title']);
    }

    public function test_the_teams_own_status_changes_are_not_reported_as_cancellations(): void
    {
        $order = $this->order(['reference' => 'SLS-O-1004', 'status' => 'confirmed']);
        $admin = $this->admin();

        Sanctum::actingAs($admin);
        $this->patchJson("/api/orders/{$order->id}", ['status' => 'cancelled'])->assertOk();

        $kinds = collect($this->getJson('/api/activity')->json('data'))->pluck('kind');

        $this->assertNotContains('order.cancelled', $kinds);
    }

    public function test_the_unread_count_covers_everything_since_this_admin_last_looked(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $this->order(['reference' => 'SLS-O-1005']);
        Inquiry::create(['name' => 'Early', 'email' => 'early@example.com', 'event_type' => 'Expo', 'message' => '.']);

        $this->getJson('/api/activity')->assertOk()->assertJsonPath('unread_count', 2);

        $this->postJson('/api/activity/seen')->assertOk()->assertJsonPath('unread_count', 0);
        $this->getJson('/api/activity')->assertJsonPath('unread_count', 0);

        // Anything arriving after the watermark is new again.
        $this->travel(1)->minute();
        $this->order(['reference' => 'SLS-O-1006']);

        $this->getJson('/api/activity')->assertJsonPath('unread_count', 1);
    }

    public function test_the_unread_count_is_not_capped_by_the_page_size(): void
    {
        // A badge that stops climbing at the page size would tell an
        // overloaded team they are nearly caught up.
        foreach (range(1, 45) as $i) {
            $this->order(['reference' => 'SLS-O-B'.$i]);
        }

        Sanctum::actingAs($this->admin());

        $response = $this->getJson('/api/activity')->assertOk();

        $this->assertSame(45, $response->json('unread_count'));
        $this->assertCount(40, $response->json('data'));
    }

    public function test_the_watermark_is_per_admin(): void
    {
        $this->order(['reference' => 'SLS-O-1007']);

        $first = $this->admin();
        Sanctum::actingAs($first);
        $this->postJson('/api/activity/seen')->assertOk();

        // A colleague reading the feed must not clear it for everyone else.
        Sanctum::actingAs($this->admin());
        $this->getJson('/api/activity')->assertJsonPath('unread_count', 1);
    }

    public function test_events_carry_their_own_read_state(): void
    {
        $this->order(['reference' => 'SLS-O-1008', 'created_at' => now()->subDay()]);

        $admin = $this->admin();
        Sanctum::actingAs($admin);
        $this->postJson('/api/activity/seen')->assertOk();

        $this->travel(1)->minute();
        $this->order(['reference' => 'SLS-O-1009']);

        $read = collect($this->getJson('/api/activity')->json('data'))->pluck('unread', 'title');

        $this->assertTrue($read['Order placed — SLS-O-1009']);
        $this->assertFalse($read['Order placed — SLS-O-1008']);
    }

    public function test_a_customer_cannot_read_the_activity_feed(): void
    {
        // It spans every account, so it is not a member's business.
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->getJson('/api/activity')->assertForbidden();
        $this->postJson('/api/activity/seen')->assertForbidden();
    }

    public function test_a_guest_cannot_read_the_activity_feed(): void
    {
        $this->getJson('/api/activity')->assertUnauthorized();
    }
}
