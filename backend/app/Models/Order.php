<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'reference', 'type', 'status', 'user_id',
        'contact_name', 'contact_email', 'company', 'items', 'total', 'notes',
        'status_history',
        'event_type', 'event_date', 'venue', 'delivery_address',
    ];

    protected $casts = [
        'items' => 'array',
        'status_history' => 'array',
        'event_date' => 'date',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
