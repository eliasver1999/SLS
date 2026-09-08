<?php

namespace App\Http\Controllers;

use App\Models\ErrorEvent;
use App\Services\ErrorLog;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ErrorEventController extends Controller
{
    /**
     * Grouped errors for the admin, most recent first.
     */
    public function index(Request $request)
    {
        $data = $request->validate([
            'state' => ['nullable', Rule::in(['open', 'resolved', 'all'])],
        ]);

        $state = $data['state'] ?? 'open';

        $events = ErrorEvent::query()
            ->with('user:id,name,email')
            ->when($state === 'open', fn ($q) => $q->unresolved())
            ->when($state === 'resolved', fn ($q) => $q->whereNotNull('resolved_at'))
            ->orderByDesc('last_seen_at')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => $events->map(fn (ErrorEvent $event) => $this->payload($event)),
            'counts' => [
                'open' => ErrorEvent::query()->unresolved()->count(),
                'resolved' => ErrorEvent::query()->whereNotNull('resolved_at')->count(),
            ],
        ]);
    }

    /**
     * Mark one dealt with, or reopen it.
     *
     * Resolving is not deleting: if the same crash happens again the record
     * reopens itself, so "resolved" can never quietly hide a live problem.
     */
    public function update(Request $request, ErrorEvent $errorEvent)
    {
        $data = $request->validate([
            'resolved' => ['required', 'boolean'],
        ]);

        $errorEvent->resolved_at = $data['resolved'] ? now() : null;
        $errorEvent->save();

        return response()->json(['data' => $this->payload($errorEvent->fresh())]);
    }

    /**
     * An error reported by the browser.
     *
     * Public on purpose: the errors most worth knowing about happen to
     * visitors who are not signed in, and a broken page often cannot
     * authenticate anyway. That makes this an endpoint strangers can write
     * to, so it is rate limited at the route, every field is length-capped,
     * and nothing here is ever rendered as anything but text.
     */
    public function store(Request $request, ErrorLog $log)
    {
        $data = $request->validate([
            'type' => ['nullable', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:2000'],
            'file' => ['nullable', 'string', 'max:250'],
            'line' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'url' => ['nullable', 'string', 'max:500'],
            'stack' => ['nullable', 'string', 'max:4000'],
            'release' => ['nullable', 'string', 'max:60'],
        ]);

        $log->recordClient($data, $request);

        // Deliberately no body: the page that just broke has nothing useful
        // to do with a reply, and a stranger learns nothing from it.
        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(ErrorEvent $event): array
    {
        return [
            'id' => $event->id,
            'source' => $event->source,
            'type' => $event->type,
            'message' => $event->message,
            'file' => $event->file,
            'line' => $event->line,
            'method' => $event->method,
            'url' => $event->url,
            'trace' => $event->trace,
            'context' => $event->context,
            'occurrences' => $event->occurrences,
            'first_seen_at' => $event->first_seen_at?->toIso8601String(),
            'last_seen_at' => $event->last_seen_at?->toIso8601String(),
            'resolved_at' => $event->resolved_at?->toIso8601String(),
            'user' => $event->user ? ['name' => $event->user->name, 'email' => $event->user->email] : null,
        ];
    }
}
