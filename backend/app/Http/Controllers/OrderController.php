<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Mail\NewOrderNotification;
use App\Mail\OrderReceived;
use App\Mail\OrderStatusUpdated;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    private const PREFIX = ['quote' => 'SLS-Q-', 'order' => 'SLS-O-', 'rental' => 'SLS-R-'];

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

        return OrderResource::collection($query->get());
    }

    /**
     * A signed-in customer submits a quote / order / rental request.
     */
    public function store(StoreOrderRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        $order = Order::create([
            'reference' => uniqid('tmp-'),
            'type' => $data['type'],
            'status' => 'pending',
            'user_id' => $user->id,
            'contact_name' => $user->name,
            'contact_email' => $user->email,
            'company' => $user->company,
            'items' => $data['items'],
            'notes' => $data['notes'] ?? null,
        ]);
        $order->update([
            'reference' => (self::PREFIX[$order->type] ?? 'SLS-X-').(2000 + $order->id),
        ]);

        // Automated transactional email: customer gets the terms, sales gets a
        // heads-up to follow up. Mail failures must not break the request.
        try {
            if ($order->contact_email) {
                Mail::to($order->contact_email)->send(new OrderReceived($order));
            }
            Mail::to(config('sls.sales_email'))->send(new NewOrderNotification($order));
        } catch (\Throwable $e) {
            Log::error('Order email failed', ['reference' => $order->reference, 'error' => $e->getMessage()]);
        }

        return (new OrderResource($order))->response()->setStatusCode(201);
    }

    /**
     * Admin updates status (and optionally a quoted total).
     */
    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['pending', 'quoted', 'confirmed', 'in_production', 'completed', 'cancelled'])],
            'total' => ['sometimes', 'nullable', 'string', 'max:40'],
        ]);

        $previousStatus = $order->status;
        $order->update($validated);

        // Notify the customer when the admin actually changes the status.
        if (isset($validated['status']) && $validated['status'] !== $previousStatus && $order->contact_email) {
            try {
                Mail::to($order->contact_email)->send(new OrderStatusUpdated($order, $previousStatus));
            } catch (\Throwable $e) {
                Log::error('Status email failed', ['reference' => $order->reference, 'error' => $e->getMessage()]);
            }
        }

        return new OrderResource($order);
    }
}
