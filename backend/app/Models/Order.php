<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'reference', 'type', 'status', 'user_id',
        'contact_name', 'contact_email', 'company', 'vat_number', 'items', 'notes',
        'status_history',
        'event_type', 'event_date', 'venue', 'delivery_address',
        'currency', 'subtotal_cents', 'vat_percent', 'vat_cents', 'total_cents', 'agreed_total_cents',
    ];

    protected $casts = [
        'items' => 'array',
        'status_history' => 'array',
        'event_date' => 'date',
        'subtotal_cents' => 'integer',
        'vat_percent' => 'integer',
        'vat_cents' => 'integer',
        'total_cents' => 'integer',
        'agreed_total_cents' => 'integer',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(OrderDocument::class)->latest();
    }

    /**
     * Recompute the money from the line items — the only place totals are
     * derived, so a total can never disagree with the lines it came from.
     *
     * The VAT rate is only taken from config while an order is still open;
     * once it is confirmed the rate it was quoted at is kept.
     */
    public function recalculateTotals(): void
    {
        $subtotal = 0;

        $items = array_map(function (array $item): array {
            $unit = (int) ($item['unit_price_cents'] ?? 0);
            $qty = max(1, (int) ($item['qty'] ?? 1));
            $item['unit_price_cents'] = $unit;
            $item['qty'] = $qty;
            $item['line_total_cents'] = $unit * $qty;

            return $item;
        }, $this->items ?? []);

        foreach ($items as $item) {
            $subtotal += $item['line_total_cents'];
        }

        $rate = $this->vat_percent ?: (int) config('sls.vat_percent');

        $this->items = $items;
        $this->currency = $this->currency ?: config('sls.currency');
        $this->subtotal_cents = $subtotal;
        $this->vat_percent = $rate;
        $this->vat_cents = (int) round($subtotal * $rate / 100);
        $this->total_cents = $subtotal + $this->vat_cents;
    }
}
