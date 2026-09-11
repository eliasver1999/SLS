<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

/**
 * An issued invoice.
 *
 * The figures here are a copy of the order as it stood when the invoice
 * was issued, not a view onto it. Repricing an order afterwards must not
 * change a document the customer already has.
 */
class Invoice extends Model
{
    protected $fillable = [
        'number', 'order_id', 'kind', 'issued_on', 'currency',
        'subtotal_cents', 'vat_percent', 'vat_cents', 'total_cents', 'amount_cents',
        'lines', 'bill_to', 'bill_to_vat', 'bill_to_email', 'issued_by',
    ];

    protected $casts = [
        'issued_on' => 'date',
        'lines' => 'array',
        'subtotal_cents' => 'integer',
        'vat_percent' => 'integer',
        'vat_cents' => 'integer',
        'total_cents' => 'integer',
        'amount_cents' => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * The next number in the sequence for this year.
     *
     * Taken inside a transaction with a locked read, because two admins
     * confirming orders at the same moment must not be handed the same
     * number — a duplicate invoice number is the kind of thing an auditor
     * asks about.
     */
    public static function nextNumber(?int $year = null): string
    {
        $year ??= (int) now()->format('Y');
        $prefix = 'SLS-'.$year.'-';

        return DB::transaction(function () use ($prefix) {
            $last = static::query()
                ->where('number', 'like', $prefix.'%')
                ->lockForUpdate()
                ->orderByDesc('number')
                ->value('number');

            $next = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

            return $prefix.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
        });
    }
}
