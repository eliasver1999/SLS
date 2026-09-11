<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Money received against an order.
 *
 * Recorded by the team from their bank, not captured by the site — nothing
 * here takes a payment, so every row is somebody saying "this arrived".
 */
class OrderPayment extends Model
{
    protected $fillable = [
        'amount_cents', 'received_on', 'method', 'reference', 'note', 'recorded_by',
    ];

    protected $casts = [
        'amount_cents' => 'integer',
        'received_on' => 'date',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
