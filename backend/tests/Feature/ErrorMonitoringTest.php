<?php

namespace Tests\Feature;

use App\Models\ErrorEvent;
use App\Models\User;
use App\Services\ErrorLog;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;
use Tests\TestCase;

/**
 * Error monitoring.
 *
 * The value of this feature is entirely in what it does *not* record: a
 * table full of validation failures and 404s is the same as no table at
 * all, because nobody reads it. So most of these tests are about noise.
 */
class ErrorMonitoringTest extends TestCase
{
    use RefreshDatabase;

    private function log(): ErrorLog
    {
        return app(ErrorLog::class);
    }

    public function test_a_server_error_is_recorded(): void
    {
        $this->log()->record(new \RuntimeException('Pricing blew up'));

        $event = ErrorEvent::sole();
        $this->assertSame('RuntimeException', $event->type);
        $this->assertSame('Pricing blew up', $event->message);
        $this->assertSame(1, $event->occurrences);
        $this->assertNull($event->resolved_at);
    }

    public function test_the_same_crash_is_counted_rather_than_repeated(): void
    {
        // One failing loop must not be able to bury everything else that
        // broke today under a thousand identical rows.
        foreach (range(1, 5) as $i) {
            $this->log()->record($this->sameThrowSite($i));
        }

        $event = ErrorEvent::sole();
        $this->assertSame(5, $event->occurrences);
        // The newest circumstances win: that is the one being reproduced.
        $this->assertSame('failure 5', $event->message);
    }

    public function test_different_crashes_stay_separate(): void
    {
        $this->log()->record(new \RuntimeException('one'));
        $this->log()->record(new \LogicException('two'));

        $this->assertSame(2, ErrorEvent::count());
    }

    /**
     * The provider names the cases rather than building them: a data provider
     * is static and runs before the application boots, so a Laravel exception
     * cannot be constructed there.
     */
    #[DataProvider('expectedFailures')]
    public function test_normal_rejections_are_not_errors(string $case): void
    {
        $e = match ($case) {
            'validation' => ValidationException::withMessages(['email' => 'required']),
            'unauthenticated' => new AuthenticationException,
            'not-found' => new NotFoundHttpException('no such page'),
        };

        $this->log()->record($e);

        $this->assertSame(0, ErrorEvent::count(), $e::class.' should not be recorded.');
    }

    public static function expectedFailures(): array
    {
        return [
            'a rejected form' => ['validation'],
            'a signed-out visitor' => ['unauthenticated'],
            'a mistyped URL' => ['not-found'],
        ];
    }

    public function test_a_5xx_http_exception_is_still_an_error(): void
    {
        // 4xx is the request being wrong; 5xx is us being wrong.
        $this->log()->record(new ServiceUnavailableHttpException(null, 'Payment gateway down'));

        $this->assertSame(1, ErrorEvent::count());
    }

    public function test_a_resolved_error_reopens_when_it_happens_again(): void
    {
        $this->log()->record($this->sameThrowSite(1));
        ErrorEvent::sole()->update(['resolved_at' => now()]);

        $this->log()->record($this->sameThrowSite(2));

        // "Resolved" must never be able to hide something still happening.
        $this->assertNull(ErrorEvent::sole()->resolved_at);
        $this->assertSame(2, ErrorEvent::sole()->occurrences);
    }

    public function test_a_sensitive_query_parameter_is_not_stored(): void
    {
        // A password-reset URL carries a token. An error on that route must
        // not put the token in a table the whole team can read.
        $this->log()->record(
            new \RuntimeException('boom'),
            Request::create('/api/reset-password?token=super-secret&email=a@b.c', 'GET'),
        );

        $url = ErrorEvent::sole()->url;
        $this->assertStringNotContainsString('super-secret', $url);
        $this->assertStringNotContainsString('a@b.c', $url);
        $this->assertStringContainsString('[redacted]', $url);
    }

    public function test_recording_never_throws_out_of_the_handler(): void
    {
        // If monitoring can break a request, it is worse than no monitoring —
        // and the case that matters is the database itself being the thing
        // that is broken, since that is when the handler fires most.
        config([
            'database.connections.unreachable' => [
                'driver' => 'sqlite',
                'database' => '/nonexistent/directory/database.sqlite',
            ],
            'database.default' => 'unreachable',
        ]);

        try {
            $this->assertNull($this->log()->record(new \RuntimeException('boom')));
        } finally {
            // Restored in the test body: the transaction this case runs
            // inside belongs to the real connection.
            config(['database.default' => 'sqlite']);
        }
    }

    public function test_the_browser_can_report_an_error_without_signing_in(): void
    {
        // The errors most worth knowing about happen to visitors who are not
        // signed in, on a page that may be too broken to authenticate.
        $this->postJson('/api/client-errors', [
            'type' => 'TypeError',
            'message' => "Cannot read properties of undefined (reading 'total')",
            'url' => '/quote',
            'line' => 42,
        ])->assertNoContent();

        $event = ErrorEvent::sole();
        $this->assertSame('client', $event->source);
        $this->assertSame('TypeError', $event->type);
    }

    public function test_a_client_report_is_length_capped(): void
    {
        // A public write endpoint is a stranger's chance to fill the disk.
        $this->postJson('/api/client-errors', [
            'message' => str_repeat('x', 5000),
        ])->assertStatus(422)->assertJsonValidationErrors(['message']);
    }

    public function test_a_client_report_requires_a_message(): void
    {
        $this->postJson('/api/client-errors', ['type' => 'Error'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    public function test_an_admin_sees_open_errors_and_can_resolve_one(): void
    {
        $this->log()->record(new \RuntimeException('Pricing blew up'));
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->getJson('/api/error-events')
            ->assertOk()
            ->assertJsonPath('counts.open', 1)
            ->assertJsonPath('data.0.type', 'RuntimeException');

        $id = ErrorEvent::sole()->id;
        $this->patchJson("/api/error-events/{$id}", ['resolved' => true])->assertOk();

        $this->getJson('/api/error-events')->assertJsonPath('counts.open', 0);
        $this->getJson('/api/error-events?state=resolved')->assertJsonCount(1, 'data');
    }

    public function test_a_customer_cannot_read_the_error_log(): void
    {
        // Traces name files and internals; that is not a customer's business.
        $this->log()->record(new \RuntimeException('boom'));
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->getJson('/api/error-events')->assertForbidden();
    }

    public function test_a_guest_cannot_read_the_error_log(): void
    {
        $this->getJson('/api/error-events')->assertUnauthorized();
    }

    public function test_old_errors_are_prunable(): void
    {
        $this->log()->record(new \RuntimeException('ancient'));
        ErrorEvent::sole()->update(['last_seen_at' => now()->subMonths(4)]);

        // The table holds URLs and user references, so keeping it forever
        // would be collecting personal data with no purpose.
        $this->artisan('model:prune', ['--model' => [ErrorEvent::class]])->assertExitCode(0);

        $this->assertSame(0, ErrorEvent::count());
    }

    /** Every call throws from the same line, which is what grouping keys on. */
    private function sameThrowSite(int $i): \RuntimeException
    {
        return new \RuntimeException("failure {$i}");
    }
}
