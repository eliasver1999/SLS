<?php

namespace Tests\Feature;

use App\Services\TransactionalMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The shipped default copy must actually render.
 *
 * A placeholder is only substituted if the event declares it, so a default
 * body using {{ sales_email }} in an event whose allowlist omits it reaches
 * the customer as the literal text "{{ sales_email }}". That is exactly
 * what happened to all six order-status emails, and it stayed invisible
 * because nothing was being delivered to look at.
 */
class EmailTemplateIntegrityTest extends TestCase
{
    use RefreshDatabase;

    public function test_no_default_template_uses_an_undeclared_placeholder(): void
    {
        $problems = [];

        foreach (config('emails.events') as $event => $definition) {
            preg_match_all(
                '/\{\{\s*([\w.]+)\s*\}\}/',
                $definition['default_subject'].' '.$definition['default_body'],
                $matches,
            );

            $undeclared = array_diff(array_unique($matches[1]), $definition['placeholders']);

            if ($undeclared !== []) {
                $problems[] = $event.' uses '.implode(', ', $undeclared);
            }
        }

        $this->assertSame([], $problems, "Templates would render a literal placeholder:\n".implode("\n", $problems));
    }

    public function test_every_event_declares_the_blocks_its_defaults_switch_on(): void
    {
        // A default block that is not in the available list can never be
        // rendered, so the email silently loses a table or a panel.
        foreach (config('emails.events') as $event => $definition) {
            $unavailable = array_diff($definition['default_blocks'], $definition['blocks']);

            $this->assertSame([], $unavailable, "{$event} defaults to unavailable blocks.");
        }
    }

    public function test_every_declared_placeholder_has_a_sample_value(): void
    {
        // Without one, the admin preview and the test send show the literal
        // token — which reads as a broken template rather than as missing
        // sample data.
        $mail = app(TransactionalMail::class);

        foreach (config('emails.events') as $event => $definition) {
            $available = array_keys(array_merge($mail->globals(), $mail->sample($event)));

            $this->assertSame(
                [],
                array_values(array_diff($definition['placeholders'], $available)),
                "{$event} declares placeholders with no sample value.",
            );
        }
    }

    public function test_every_event_renders_with_no_placeholder_left_behind(): void
    {
        // The end-to-end version of the first test: render each event the way
        // it is actually sent and assert nothing is left unsubstituted.
        $mail = app(TransactionalMail::class);

        foreach (array_keys(config('emails.events')) as $event) {
            // The same merge the admin preview does: globals plus sample
            // data. render() applies the event's allowlist itself.
            $rendered = $mail->render($event, array_merge($mail->globals(), $mail->sample($event)));

            $this->assertNotNull($rendered, "{$event} did not render.");
            $this->assertDoesNotMatchRegularExpression(
                '/\{\{\s*[\w.]+\s*\}\}/',
                $rendered['subject'].' '.$rendered['body'],
                "{$event} renders a literal placeholder.",
            );
        }
    }
}
