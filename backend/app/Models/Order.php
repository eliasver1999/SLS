<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'reference', 'type', 'status', 'user_id',
        'contact_name', 'contact_email', 'company', 'items', 'total', 'notes',
    ];

    protected $casts = [
        'items' => 'array',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
