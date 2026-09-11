<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use App\Services\TransactionalMail;
use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    private const PREFIX = ['quote' => 'SLS-Q-', 'order' => 'SLS-O-'];

    /**
     * Customers see their own requests; admins see all (with ?type= / ?status=).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Order::query()->with(['documents', 'payments'])->latest();

        if (! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        // Free-text search across the fields someone would actually have to
        // hand: a reference from an email, a company, or the venue they are
        // ringing about. Grouped so it cannot widen a customer's own-orders
        // restriction above into an OR across everybody's.
        if ($request->filled('q')) {
            $term = '%'.str_replace(['%', '_'], ['\%', '\_'], trim($request->string('q'))).'%';

            $query->where(function ($scoped) use ($term) {
                foreach (['reference', 'company', 'contact_name', 'contact_email', 'venue', 'event_type'] as $column) {
                    $scoped->orWhere($column, 'like', $term);
                }
            });
        }

        return OrderResource::collection($query->paginate($request->integer('per_page', 15)));
    }

    /**
     * An approved customer submits a quote / order request.
     */
    public function store(StoreOrderRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        // Rebuild each line from the trusted product record — name and price
        // always come from the database, never from the client payload.
        $products = Product::whereIn('slug', collect($data['items'])->pluck('slug'))
            ->get()
            ->keyBy('slug');

        $items = collect($data['items'])->map(function (array $item) use ($products) {
            $product = $products->get($item['slug']);
            $unit = (int) ($product?->buy_price_cents ?? 0);
            $qty = max(1, (int) ($item['qty'] ?? 1));

            return [
                'slug' => $item['slug'],
                'name' => $product?->name,
                'mode' => 'buy',
                'qty' => $qty,
                'configuration' => $item['configuration'] ?? null,
                'unit_price_cents' => $unit,
                'line_total_cents' => $unit * $qty,
            ];
        })->all();

        $order = Order::create([
            'reference' => uniqid('tmp-'),
            // One door: every submission is an order at the prices shown.
            'type' => 'order',
            'status' => 'pending',
            'user_id' => $user->id,
            'contact_name' => $user->name,
            'contact_email' => $user->email,
            'company' => $user->company,
            'vat_number' => $user->vat_number,
            'event_type' => $data['event_type'] ?? null,
            'event_date' => $data['event_date'] ?? null,
            'venue' => $data['venue'] ?? null,
            'delivery_address' => $data['delivery_address'] ?? null,
            'items' => $items,
            'notes' => $data['notes'] ?? null,
            'status_history' => [[
                'status' => 'pending',
                'note' => null,
                'at' => now()->toIso8601String(),
                'by' => $user->name,
                'by_role' => 'customer',
            ]],
        ]);
        $order->recalculateTotals();
        // The figure the customer actually saw. Everything after this point
        // is measured against it.
        $order->agreed_total_cents = $order->total_cents;
        $order->reference = (self::PREFIX[$order->type] ?? 'SLS-X-').(2000 + $order->id);
        $order->save();

        // Automated transactional email: customer gets the terms, sales gets a
        // heads-up to follow up. Mail failures must not break the request.
        try {
            $mail = app(TransactionalMail::class);
            $vars = TransactionalMail::varsForOrder($order);

            if ($order->contact_email) {
                $mail->send("order.received.{$order->type}", $order->contact_email, $vars, $order->items ?? []);
            }
            $mail->send('order.admin_notify', config('sls.sales_email'), $vars, $order->items ?? []);
        } catch (\Throwable $e) {
            Log::error('Order email failed', ['reference' => $order->reference, 'error' => $e->getMessage()]);
        }

        return (new OrderResource($order))->response()->setStatusCode(201);
    }

    /**
     * View a single order. Customers may only see their own; admins see any.
     */
    public function show(Request $request, Order $order)
    {
        $user = $request->user();

        if (! $user->isAdmin() && $order->user_id !== $user->id) {
            abort(403, 'This order is not yours.');
        }

        return new OrderResource($order->load(['documents', 'payments']));
    }

    /**
     * A customer accepts the quote they were sent, which turns it into a
     * confirmed order there and then.
     *
     * Before this existed the only affirmative button on a quote was "Order
     * this again", which refilled the basket and submitted a *new* request —
     * and because new lines are always repriced from the catalogue, the rate
     * the team had negotiated was silently discarded. A customer accepting a
     * €68,200 quote placed an €85,560 order and nobody was told.
     *
     * So acceptance happens in place: the same record, the same priced lines,
     * flipped from quote to order. Nothing is recalculated from the
     * catalogue, because the whole point of a quote is that the price is
     * already agreed.
     */
    public function accept(Request $request, Order $order)
    {
        $user = $request->user();

        if ($order->user_id !== $user->id) {
            abort(403, 'This quote is not yours.');
        }
        if ($order->status !== 'quoted') {
            abort(422, 'There is nothing waiting for your approval on this order.');
        }

        // An order has to be built, delivered and crewed, so it must say when
        // and where. A quote need not, so the missing details are collected
        // at the moment of acceptance.
        $data = $request->validate([
            'event_date' => [$order->event_date ? 'nullable' : 'required', 'date', 'after_or_equal:today'],
            'venue' => [$order->venue ? 'nullable' : 'required', 'string', 'max:180'],
            'event_type' => ['nullable', 'string', 'max:120'],
            'delivery_address' => ['nullable', 'string', 'max:500'],
        ], [
            'event_date.required' => 'Please give the event date so we can schedule crew and delivery.',
            'venue.required' => 'Please give the venue so we can plan delivery and setup.',
        ]);

        foreach (['event_date', 'venue', 'event_type', 'delivery_address'] as $field) {
            if (! empty($data[$field])) {
                $order->{$field} = $data[$field];
            }
        }

        $order->type = 'order';
        // Confirmed: the customer has agreed to the revised figure, so there
        // is nothing left for either side to decide.
        $order->status = 'confirmed';
        // This is now the figure they agreed to, so a later change is
        // measured against it rather than against the original.
        $order->agreed_total_cents = $order->total_cents;

        // The reference deliberately does not change. It is already on the
        // quote email, and may be on the customer's purchase order — a new
        // identifier here would orphan every message either side has kept.
        $history = $order->status_history ?? [];
        $history[] = [
            'status' => 'confirmed',
            // Money::format, not $order->total — "total" is a formatted field
            // the API resource adds, so reading it off the model produced
            // "accepted by the customer at ." in the timeline.
            'note' => 'Revised price accepted by the customer at '.Money::format($order->total_cents, $order->currency).'.',
            'at' => now()->toIso8601String(),
            'by' => $user->name,
            'by_role' => 'customer',
        ];
        $order->status_history = $history;

        // Totals are re-derived from the stored lines, never from the
        // catalogue: this keeps the negotiated price and re-snapshots nothing.
        $order->recalculateTotals();
        $order->save();

        try {
            $mail = app(TransactionalMail::class);
            $vars = TransactionalMail::varsForOrder($order, ['previous_status' => 'quoted']);

            if ($order->contact_email) {
                $mail->send('order.status.confirmed', $order->contact_email, $vars, $order->items ?? []);
            }
            // Sales needs to know a job just became real work.
            $mail->send('order.admin_notify', config('sls.sales_email'), $vars, $order->items ?? []);
        } catch (\Throwable $e) {
            Log::error('Quote acceptance email failed', ['reference' => $order->reference, 'error' => $e->getMessage()]);
        }

        Log::info('Quote accepted by customer', ['reference' => $order->reference, 'user_id' => $user->id]);

        return new OrderResource($order->load(['documents', 'payments']));
    }

    /**
     * A customer cancels their own request while it's still cancellable
     * (pending / quoted — before we've confirmed or started production).
     */
    public function cancel(Request $request, Order $order)
    {
        $user = $request->user();

        if ($order->user_id !== $user->id) {
            abort(403, 'This order is not yours.');
        }
        if (! in_array($order->status, ['pending', 'quoted'], true)) {
            abort(422, 'This request can no longer be cancelled online — please contact us.');
        }

        $order->status = 'cancelled';
        $history = $order->status_history ?? [];
        $history[] = [
            'status' => 'cancelled',
            'note' => 'Cancelled by customer.',
            'at' => now()->toIso8601String(),
            'by' => $user->name,
            // Recorded so the admin activity feed can distinguish a customer
            // walking away from the team's own status changes — a name alone
            // cannot be trusted to say which side of the desk it came from.
            'by_role' => 'customer',
        ];
        $order->status_history = $history;
        $order->save();

        Log::info('Order cancelled by customer', ['reference' => $order->reference, 'user_id' => $user->id]);

        return new OrderResource($order->load(['documents', 'payments']));
    }

    /**
     * Admin updates status, line pricing and/or a customer-visible note.
     * Every status change or note is appended to the order's status history,
     * and the customer is emailed.
     *
     * Totals are never accepted from the client: they are derived from the
     * lines, so an invoice total cannot drift from what it is made of. A
     * negotiated discount belongs in a line of its own.
     */
    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['pending', 'quoted', 'confirmed', 'in_production', 'completed', 'cancelled'])],
            'note' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.slug' => ['required_with:items', 'string'],
            'items.*.name' => ['required_with:items', 'string'],
            'items.*.mode' => ['nullable', Rule::in(['buy'])],
            'items.*.qty' => ['nullable', 'integer', 'min:1'],
            'items.*.configuration' => ['nullable', 'string', 'max:160'],
            // Signed, so a discount or credit line is expressible.
            'items.*.unit_price_cents' => ['nullable', 'integer', 'min:-100000000', 'max:100000000'],
        ]);

        $previousStatus = $order->status;
        $newStatus = $validated['status'] ?? $order->status;
        $note = isset($validated['note']) ? trim((string) $validated['note']) : null;
        $statusChanged = $newStatus !== $previousStatus;

        if (array_key_exists('items', $validated)) {
            $order->items = $validated['items'];
        }
        $order->status = $newStatus;
        $order->recalculateTotals();

        // A discount needs no further agreement — nobody disputes paying less
        // — so the team can lower a price and confirm in one step. A rise is
        // the opposite: confirming it would commit the customer to a figure
        // they have never seen. That has to go back to them, so the status
        // becomes "quoted" and waits for their acceptance instead.
        $costsMoreThanAgreed = $order->agreed_total_cents !== null
            && $order->total_cents > $order->agreed_total_cents;

        if ($costsMoreThanAgreed && in_array($newStatus, ['confirmed', 'in_production', 'completed'], true)) {
            $newStatus = 'quoted';
            $order->status = 'quoted';
            $statusChanged = $newStatus !== $previousStatus;
        }

        // Record an audit-trail entry when the status changes or a note is added.
        if ($statusChanged || ! empty($note)) {
            $history = $order->status_history ?? [];
            $history[] = [
                'status' => $newStatus,
                'note' => $note ?: null,
                'at' => now()->toIso8601String(),
                'by' => $request->user()->name,
                'by_role' => 'admin',
            ];
            $order->status_history = $history;
        }

        $order->save();

        // Notify the customer when something customer-relevant changed.
        if (($statusChanged || ! empty($note)) && $order->contact_email) {
            try {
                app(TransactionalMail::class)->send(
                    "order.status.{$order->status}",
                    $order->contact_email,
                    TransactionalMail::varsForOrder($order, [
                        'previous_status' => $previousStatus,
                        'note' => $note ?: null,
                    ]),
                    $order->items ?? [],
                );
            } catch (\Throwable $e) {
                Log::error('Status email failed', ['reference' => $order->reference, 'error' => $e->getMessage()]);
            }
        }

        return new OrderResource($order->load(['documents', 'payments']));
    }
}
