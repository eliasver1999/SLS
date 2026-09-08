<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ErrorEvent extends Model
{
    /** Old errors are not evidence, they are clutter. */
    use Prunable;

    protected $fillable = [
        'fingerprint', 'source', 'type', 'message', 'file', 'line',
        'method', 'url', 'trace', 'user_id', 'context',
        'occurrences', 'first_seen_at', 'last_seen_at', 'resolved_at',
    ];

    protected $casts = [
        'context' => 'array',
        'line' => 'integer',
        'occurrences' => 'integer',
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeUnresolved(Builder $query): Builder
    {
        return $query->whereNull('resolved_at');
    }

    /**
     * Dealt with a fortnight ago, or untouched for three months.
     *
     * The table also holds URLs and user references, so keeping it forever
     * would be collecting personal data with no purpose — which is both bad
     * practice and, under GDPR, not allowed.
     */
    public function prunable(): Builder
    {
        return static::query()
            ->where(fn (Builder $q) => $q->whereNotNull('resolved_at')
                ->where('resolved_at', '<', now()->subWeeks(2)))
            ->orWhere('last_seen_at', '<', now()->subMonths(3));
    }
}
