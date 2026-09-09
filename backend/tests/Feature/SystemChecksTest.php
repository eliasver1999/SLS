<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\SystemChecks;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Deployment checks.
 *
 * These exist because of a real and expensive class of bug: the whole
 * transactional email system was complete and delivering nothing, because
 * MAIL_MAILER was 'log'. Every screen looked healthy. So the tests are less
 * about the checks passing than about them refusing to report success when
 * the system is not doing the thing it appears to do.
 */
class SystemChecksTest extends TestCase
{
    use RefreshDatabase;

    private function statusOf(string $key): string
    {
        return collect(app(SystemChecks::class)->all())->firstWhere('key', $key)['status'];
    }

    public function test_a_log_mailer_is_reported_as_a_failure(): void
    {
        config(['mail.default' => 'log']);

        $this->assertSame('fail', $this->statusOf('mail.transport'));
    }

    public function test_an_array_mailer_is_reported_as_a_failure(): void
    {
        // The test suite's own transport. It swallows mail exactly like 'log'
        // does, so it must not be treated as a working configuration.
        config(['mail.default' => 'array']);

        $this->assertSame('fail', $this->statusOf('mail.transport'));
    }

    public function test_configured_smtp_passes(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            // A real provider's host: without one, this would be testing the
            // local-catcher branch instead.
            'mail.mailers.smtp.host' => 'smtp.eu.mailgun.org',
            'mail.mailers.smtp.username' => 'postmaster@sls.gr',
        ]);

        $this->assertSame('ok', $this->statusOf('mail.transport'));
    }

    public function test_a_local_mail_catcher_is_not_reported_as_working_email(): void
    {
        // The development setup: real SMTP, but to a catcher that writes to
        // disk. Reporting this as "email works" would be the original bug
        // wearing a different hat.
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            'mail.mailers.smtp.host' => '127.0.0.1',
            'mail.mailers.smtp.port' => 1025,
        ]);

        $this->assertSame('warn', $this->statusOf('mail.transport'));

        // And in production it is not a warning, it is an outage.
        app()->detectEnvironment(fn () => 'production');
        $this->assertSame('fail', $this->statusOf('mail.transport'));
    }

    public function test_a_test_send_through_a_catcher_says_where_it_went(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            'mail.mailers.smtp.host' => '127.0.0.1',
            'mail.mailers.smtp.port' => 1025,
        ]);
        Mail::fake();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->postJson('/api/email-templates/member.approved/test', [
            'to' => 'admin@sls.gr',
        ])->assertOk();

        $this->assertTrue($response->json('delivered'));
        $this->assertStringContainsString('local catcher', $response->json('message'));
    }

    public function test_smtp_without_credentials_is_flagged(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.eu.mailgun.org',
            'mail.mailers.smtp.username' => null,
        ]);

        $this->assertSame('warn', $this->statusOf('mail.transport'));
    }

    public function test_a_placeholder_sender_address_is_reported(): void
    {
        config(['mail.from.address' => 'hello@example.com']);

        $this->assertSame('fail', $this->statusOf('mail.from'));
    }

    public function test_a_real_sender_address_passes(): void
    {
        config(['mail.from.address' => 'no-reply@sls.gr']);

        $this->assertSame('ok', $this->statusOf('mail.from'));
    }

    public function test_a_malformed_app_url_is_reported(): void
    {
        // This one took the whole API down on a live deploy: Laravel builds a
        // request from APP_URL for console commands, and a placeholder value
        // fails before anything else runs.
        config(['app.url' => 'https://<will fill in after first deploy>']);

        $this->assertSame('fail', $this->statusOf('app.url'));
    }

    public function test_a_localhost_frontend_url_is_correct_locally_and_fatal_in_production(): void
    {
        // The same value is right and wrong depending on where it runs, so
        // the check reads the environment rather than the string alone.
        config(['app.frontend_url' => 'http://localhost:5173']);
        $this->assertSame('ok', $this->statusOf('app.frontend_url'));

        app()->detectEnvironment(fn () => 'production');
        $this->assertSame('fail', $this->statusOf('app.frontend_url'));
    }

    public function test_a_malformed_frontend_url_is_reported_anywhere(): void
    {
        config(['app.frontend_url' => 'not-a-url']);

        $this->assertSame('warn', $this->statusOf('app.frontend_url'));
    }

    public function test_the_endpoint_reports_problems_to_an_admin(): void
    {
        config(['mail.default' => 'log']);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->getJson('/api/system-checks')->assertOk();

        $this->assertFalse($response->json('passing'));
        $this->assertContains('mail.transport', collect($response->json('problems'))->pluck('key'));
        // Passing checks are not listed as problems.
        $this->assertNotContains('ok', collect($response->json('problems'))->pluck('status'));
    }

    public function test_a_customer_cannot_read_the_deployment_configuration(): void
    {
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->getJson('/api/system-checks')->assertForbidden();
    }

    public function test_a_test_send_does_not_claim_delivery_through_a_sink_transport(): void
    {
        // The email templates page is where an admin goes to find out whether
        // email works. Answering "sent" there while the message went into a
        // log file is how the original problem stayed hidden.
        config(['mail.default' => 'log']);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->postJson('/api/email-templates/member.approved/test', [
            'to' => 'admin@sls.gr',
        ])->assertOk();

        $this->assertFalse($response->json('delivered'));
        $this->assertStringContainsString('Nothing was delivered', $response->json('message'));
    }

    public function test_a_test_send_reports_delivery_when_the_transport_is_real(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            // A real provider's host: without one, this would be testing the
            // local-catcher branch instead.
            'mail.mailers.smtp.host' => 'smtp.eu.mailgun.org',
            'mail.mailers.smtp.username' => 'postmaster@sls.gr',
        ]);
        // Intercept the send itself so the assertion is about the reporting,
        // not about reaching a mail server from a test run.
        Mail::fake();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->postJson('/api/email-templates/member.approved/test', ['to' => 'admin@sls.gr'])
            ->assertOk()
            ->assertJsonPath('delivered', true);
    }

    public function test_the_preflight_command_fails_the_build_on_a_broken_deployment(): void
    {
        config(['mail.default' => 'log']);

        // Non-zero so a deploy script can gate on it rather than relying on
        // somebody reading the output.
        $this->artisan('sls:preflight')->assertExitCode(1);
    }

    public function test_the_preflight_command_passes_a_healthy_deployment(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            // A real provider's host: without one, this would be testing the
            // local-catcher branch instead.
            'mail.mailers.smtp.host' => 'smtp.eu.mailgun.org',
            'mail.mailers.smtp.username' => 'postmaster@sls.gr',
            'mail.from.address' => 'no-reply@sls.gr',
            'app.url' => 'https://api.sls.gr',
            'app.frontend_url' => 'https://sls.gr',
        ]);

        $this->artisan('sls:preflight')->assertExitCode(0);
    }
}
