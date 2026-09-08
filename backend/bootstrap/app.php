<?php

use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\ForceJsonResponse;
use App\Services\ErrorLog;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Must run before the auth middleware, so an unauthenticated request
        // is already marked as wanting JSON by the time it is rejected.
        $middleware->api(prepend: [
            ForceJsonResponse::class,
        ]);

        $middleware->alias([
            'admin' => EnsureAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Record failures where they outlive a restart and someone will see
        // them. Reporting continues to the log as well: this callback adds a
        // destination rather than replacing one, so nothing is lost if the
        // database is the thing that is broken.
        $exceptions->report(function (Throwable $e) {
            app(ErrorLog::class)->record(
                $e,
                app()->runningInConsole() ? null : request(),
            );
        });
    })->create();
