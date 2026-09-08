<?php

namespace App\Services;

use App\Models\ErrorEvent;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

/**
 * Records errors so somebody can find out about them.
 *
 * The application already wrote to storage/logs, which on the deployed
 * container is an ephemeral disk nobody reads and a restart wipes. A 500 in
 * a customer's checkout reached the team as a phone call or not at all.
 *
 * Identical crashes collapse onto one fingerprint and increment a counter,
 * so one failure in a loop cannot bury everything else that broke today.
 */
class ErrorLog
{
    /**
     * Exceptions that are the application working correctly: a rejected
     * form, a signed-out visitor, a mistyped URL. Recording these would
     * bury the real failures under normal traffic.
     */
    private const EXPECTED = [
        ValidationException::class,
        AuthenticationException::class,
        AuthorizationException::class,
        ModelNotFoundException::class,
        TokenMismatchException::class,
    ];

    /** Query parameters never worth keeping, whatever they contain. */
    private const REDACT = ['token', 'password', 'secret', 'signature', 'api_key', 'key', 'email'];

    /**
     * Guards against an error raised *by* this recorder being fed back into
     * it — a database that has gone away would otherwise recurse until the
     * process died.
     */
    private static bool $recording = false;

    public function record(Throwable $e, ?Request $request = null): ?ErrorEvent
    {
        if (self::$recording || $this->isExpected($e)) {
            return null;
        }

        self::$recording = true;

        try {
            return $this->store([
                'source' => 'api',
                'type' => $e::class,
                'message' => Str::limit($e->getMessage(), 2000),
                'file' => $this->relative($e->getFile()),
                'line' => $e->getLine(),
                'method' => $request?->method(),
                'url' => $request ? $this->safeUrl($request) : null,
                // Enough frames to see where it came from, not the whole novel.
                'trace' => $this->trace($e),
                'user_id' => $request?->user()?->id,
                'context' => array_filter([
                    'route' => $request?->route()?->getName() ?? $request?->path(),
                    'status' => $e instanceof HttpExceptionInterface ? $e->getStatusCode() : null,
                    'previous' => $e->getPrevious() ? $e->getPrevious()::class : null,
                ]),
            ]);
        } catch (Throwable $failure) {
            // Never let monitoring be the reason a request fails. The log
            // file is a poor destination, which is the whole point of this
            // class — but it is better than throwing from a handler.
            Log::warning('Could not record an error event', ['error' => $failure->getMessage()]);

            return null;
        } finally {
            self::$recording = false;
        }
    }

    /**
     * An error reported by the browser.
     *
     * @param  array<string, mixed>  $payload
     */
    public function recordClient(array $payload, ?Request $request = null): ?ErrorEvent
    {
        try {
            return $this->store([
                'source' => 'client',
                'type' => Str::limit((string) ($payload['type'] ?? 'Error'), 120),
                'message' => Str::limit((string) ($payload['message'] ?? ''), 2000),
                'file' => Str::limit((string) ($payload['file'] ?? ''), 250) ?: null,
                'line' => isset($payload['line']) ? (int) $payload['line'] : null,
                // No method: a browser error happened on a page, not during a
                // request, and labelling it GET invents a fact.
                'method' => null,
                'url' => Str::limit((string) ($payload['url'] ?? ''), 500) ?: null,
                'trace' => Str::limit((string) ($payload['stack'] ?? ''), 4000) ?: null,
                'user_id' => $request?->user()?->id,
                'context' => array_filter([
                    // Which build it happened on: a stack trace against a
                    // bundle that no longer exists is unreadable.
                    'release' => Arr::get($payload, 'release'),
                    'agent' => Str::limit((string) $request?->userAgent(), 250) ?: null,
                ]),
            ]);
        } catch (Throwable $failure) {
            Log::warning('Could not record a client error', ['error' => $failure->getMessage()]);

            return null;
        }
    }

    /**
     * Insert the group, or increment the one that already exists.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function store(array $attributes): ErrorEvent
    {
        $fingerprint = $this->fingerprint($attributes);

        $event = ErrorEvent::firstOrNew(['fingerprint' => $fingerprint]);

        if ($event->exists) {
            $event->occurrences += 1;
            $event->last_seen_at = now();
            // Something we thought was fixed is happening again, so it comes
            // back to the top rather than staying quietly resolved.
            $event->resolved_at = null;
            // Keep the newest circumstances: the latest occurrence is the one
            // somebody is about to go and reproduce.
            $event->fill(Arr::only($attributes, ['message', 'url', 'method', 'user_id', 'context', 'trace']));
        } else {
            $event->fill($attributes);
            $event->fingerprint = $fingerprint;
            $event->occurrences = 1;
            $event->first_seen_at = now();
            $event->last_seen_at = now();
        }

        $event->save();

        return $event;
    }

    /**
     * What makes two errors "the same error".
     *
     * Type, file and line — never the message, which usually carries an id
     * or a value and would split one bug into hundreds of unreadable rows.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function fingerprint(array $attributes): string
    {
        return hash('sha256', implode('|', [
            $attributes['source'],
            $attributes['type'],
            $attributes['file'] ?? '',
            $attributes['line'] ?? '',
        ]));
    }

    private function isExpected(Throwable $e): bool
    {
        foreach (self::EXPECTED as $class) {
            if ($e instanceof $class) {
                return true;
            }
        }

        // A 404 or a 422 is a request being wrong, not the application. Only
        // 5xx (and anything without a status) is our problem.
        return $e instanceof HttpExceptionInterface && $e->getStatusCode() < 500;
    }

    /** Project-relative, so the path is readable and reveals no server layout. */
    private function relative(string $path): string
    {
        return Str::after(str_replace('\\', '/', $path), rtrim(str_replace('\\', '/', base_path()), '/').'/');
    }

    /**
     * The URL with sensitive query parameters removed.
     *
     * A password-reset link carries a token; an error on that route should
     * not put the token in a table an admin can read.
     */
    private function safeUrl(Request $request): string
    {
        $query = $request->query();

        foreach (array_keys($query) as $key) {
            if (in_array(strtolower((string) $key), self::REDACT, true)) {
                $query[$key] = '[redacted]';
            }
        }

        // http_build_query would escape the marker to %5Bredacted%5D. This is
        // a diagnostic an admin reads, not a URL anything re-requests, so the
        // marker stays legible.
        $string = $query ? '?'.str_replace('%5Bredacted%5D', '[redacted]', http_build_query($query)) : '';

        return Str::limit($request->path().$string, 500);
    }

    private function trace(Throwable $e): string
    {
        return collect(explode("\n", $e->getTraceAsString()))
            ->take(20)
            ->map(fn (string $frame) => $this->relative($frame))
            ->implode("\n");
    }
}
