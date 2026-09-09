<?php

namespace App\Services;

use App\Models\Inquiry;
use App\Models\Order;
use App\Models\PartnerApplication;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * What the team has missed.
 *
 * Until now the only notice of a new order was the email to sales: if that
 * was filtered, deleted or simply scrolled past, nothing in the application
 * said so. This assembles the same events from the records themselves —
 * orders, enquiries, registrations, partner applications, customer
 * cancellations — so the inbox stops being the system of record.
 *
 * Nothing here is stored. Every event is derived from a row that already
 * exists, which means the feed cannot drift out of step with the thing it
 * describes, and there is no backlog to migrate: it is correct for records
 * created long before this class existed.
 */
class ActivityFeed
{
    /** How many events one page of the feed carries. */
    public const LIMIT = 40;

    /**
     * The most recent events, newest first.
     *
     * Each source is queried for its own newest LIMIT rows and the merged
     * result is trimmed back, so a flood from one source cannot starve the
     * others out of the query but also cannot inflate the work done.
     *
     * @return list<array<string, mixed>>
     */
    public function recent(?Carbon $seenAt, int $limit = self::LIMIT): array
    {
        $events = collect([
            ...$this->orderEvents($limit),
            ...$this->customerDecisionEvents($limit),
            ...$this->inquiryEvents($limit),
            ...$this->registrationEvents($limit),
            ...$this->applicationEvents($limit),
        ])
            ->sortByDesc('at')
            ->take($limit)
            ->values()
            ->map(fn (array $event) => [
                ...$event,
                'at' => $event['at']->toIso8601String(),
                // Unread is per-admin, so it is decided here rather than
                // stored on the event.
                'unread' => $seenAt === null || $event['at']->greaterThan($seenAt),
            ]);

        return $events->all();
    }

    /**
     * How many events arrived since this admin last looked.
     *
     * Counted with COUNT queries rather than by measuring the page above:
     * the page is capped at LIMIT, and a badge that stops climbing at 40 is
     * exactly the reassurance an overloaded team should not be given.
     */
    public function unreadCount(?Carbon $seenAt): int
    {
        $newer = fn ($query) => $seenAt === null
            ? $query
            : $query->where('created_at', '>', $seenAt);

        return $newer(Order::query())->count()
            + $newer(Inquiry::query())->count()
            + $newer(User::query()->where('role', 'customer'))->count()
            + $newer(PartnerApplication::query())->count()
            + count($this->customerDecisionEvents(self::LIMIT, $seenAt));
    }

    /**
     * A new order or quote request landed.
     *
     * @return list<array<string, mixed>>
     */
    private function orderEvents(int $limit): array
    {
        return Order::query()
            ->latest()
            ->limit($limit)
            ->get(['id', 'reference', 'type', 'status', 'contact_name', 'company', 'total_cents', 'currency', 'created_at'])
            ->map(fn (Order $order) => [
                'id' => "order-{$order->id}",
                'kind' => $order->type === 'quote' ? 'quote.requested' : 'order.placed',
                'at' => $order->created_at,
                'title' => $order->type === 'quote'
                    ? "Quote requested — {$order->reference}"
                    : "Order placed — {$order->reference}",
                'detail' => trim($order->company ?: $order->contact_name ?: ''),
                'amount_cents' => $order->total_cents,
                'currency' => $order->currency,
                // Where the team goes to deal with it.
                'section' => $order->type === 'quote' ? 'quotes' : 'orders',
                'order_id' => $order->id,
                // Still sitting where the customer left it: nobody has picked
                // it up yet, which is the whole point of the feed.
                'needs_action' => $order->status === 'pending',
            ])
            ->all();
    }

    /**
     * The two decisions a customer makes on their own: walking away, and
     * saying yes to a quote.
     *
     * Neither is a row of its own — both live inside the order's status
     * history — so the recently-touched orders are scanned for them. Entries
     * written before the history recorded an actor role are skipped rather
     * than guessed at from the name.
     *
     * @return list<array<string, mixed>>
     */
    private function customerDecisionEvents(int $limit, ?Carbon $since = null): array
    {
        $decisions = [
            'cancelled' => ['kind' => 'order.cancelled', 'title' => 'Cancelled by customer'],
            'confirmed' => ['kind' => 'quote.accepted', 'title' => 'Quote accepted'],
        ];

        return Order::query()
            ->whereIn('status', array_keys($decisions))
            ->latest('updated_at')
            ->limit($limit)
            ->get(['id', 'reference', 'type', 'contact_name', 'company', 'total_cents', 'currency', 'status_history'])
            ->flatMap(function (Order $order) use ($decisions) {
                return collect($order->status_history ?? [])
                    ->filter(fn ($entry) => isset($decisions[$entry['status'] ?? ''])
                        && ($entry['by_role'] ?? null) === 'customer'
                        && ! empty($entry['at']))
                    ->map(function ($entry) use ($order, $decisions) {
                        $decision = $decisions[$entry['status']];

                        return [
                            'id' => "{$entry['status']}-{$order->id}-{$entry['at']}",
                            'kind' => $decision['kind'],
                            'at' => Carbon::parse($entry['at']),
                            'title' => "{$decision['title']} — {$order->reference}",
                            'detail' => trim($order->company ?: $order->contact_name ?: ''),
                            'amount_cents' => $entry['status'] === 'confirmed' ? $order->total_cents : null,
                            'currency' => $order->currency,
                            'section' => $order->type === 'quote' ? 'quotes' : 'orders',
                            'order_id' => $order->id,
                            // An accepted quote is committed work that has to
                            // be scheduled, so it wants someone's attention.
                            'needs_action' => $entry['status'] === 'confirmed',
                        ];
                    });
            })
            ->when($since !== null, fn (Collection $events) => $events->filter(
                fn (array $event) => $event['at']->greaterThan($since),
            ))
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function inquiryEvents(int $limit): array
    {
        return Inquiry::query()
            ->latest()
            ->limit($limit)
            ->get(['id', 'name', 'email', 'event_type', 'status', 'created_at'])
            ->map(fn (Inquiry $inquiry) => [
                'id' => "inquiry-{$inquiry->id}",
                'kind' => 'inquiry.received',
                'at' => $inquiry->created_at,
                'title' => 'Enquiry from '.($inquiry->name ?: $inquiry->email),
                'detail' => $inquiry->event_type ?: $inquiry->email,
                'section' => 'inquiries',
                'needs_action' => $inquiry->status === 'new',
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function registrationEvents(int $limit): array
    {
        return User::query()
            ->where('role', 'customer')
            ->latest()
            ->limit($limit)
            ->get(['id', 'name', 'company', 'status', 'created_at'])
            ->map(fn (User $user) => [
                'id' => "member-{$user->id}",
                'kind' => 'member.registered',
                'at' => $user->created_at,
                'title' => 'New registration — '.($user->company ?: $user->name),
                'detail' => $user->company ? $user->name : '',
                'section' => 'members',
                // An unapproved member cannot see a price, so leaving one
                // waiting is a lost sale rather than untidiness.
                'needs_action' => $user->status === 'pending',
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function applicationEvents(int $limit): array
    {
        return PartnerApplication::query()
            ->latest()
            ->limit($limit)
            ->get(['id', 'company', 'contact_name', 'status', 'created_at'])
            ->map(fn (PartnerApplication $application) => [
                'id' => "application-{$application->id}",
                'kind' => 'application.received',
                'at' => $application->created_at,
                'title' => 'Partner application — '.($application->company ?: $application->contact_name),
                'detail' => $application->company ? $application->contact_name : '',
                'section' => 'approvals',
                'needs_action' => $application->status === 'pending',
            ])
            ->all();
    }
}
