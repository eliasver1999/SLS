<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use App\Services\TransactionalMail;
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
        $query = Order::query()->latest();

        if (! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
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
                'unit_price_cents' => $unit,
                'line_total_cents' => $unit * $qty,
            ];
        })->all();

        $order = Order::create([
            'reference' => uniqid('tmp-'),
            'type' => $data['type'],
            'status' => 'pending',
            'user_id' => $user->id,
            'contact_name' => $user->name,
            'contact_email' => $user->email,
            'company' => $user->company,
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
            ]],
        ]);
        $order->recalculateTotals();
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

        return new OrderResource($order);
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
        ];
        $order->status_history = $history;
        $order->save();

        Log::info('Order cancelled by customer', ['reference' => $order->reference, 'user_id' => $user->id]);

        return new OrderResource($order);
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

        // Record an audit-trail entry when the status changes or a note is added.
        if ($statusChanged || ! empty($note)) {
            $history = $order->status_history ?? [];
            $history[] = [
                'status' => $newStatus,
                'note' => $note ?: null,
                'at' => now()->toIso8601String(),
                'by' => $request->user()->name,
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

        return new OrderResource($order);
    }
}
