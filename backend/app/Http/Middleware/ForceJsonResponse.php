<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Treat every API request as wanting JSON, whatever it asked for.
 *
 * This backend serves only JSON — the SPA is a separate deployment — but the
 * framework decides how to render an error from the request's Accept header.
 * A request without one was taken for a browser navigation, so an
 * unauthenticated call tried to redirect to a named "login" route that does
 * not exist here and became "Route [login] not defined": a 500, and a stack
 * trace while APP_DEBUG is on, where a 401 belonged.
 *
 * Setting the header up front fixes that at the source and makes every other
 * error render consistently too, rather than depending on how the caller
 * happened to phrase the request.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
