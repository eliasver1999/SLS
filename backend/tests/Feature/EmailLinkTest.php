<?php

namespace Tests\Feature;

use App\Mail\TemplatedMail;
use App\Services\TransactionalMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Where the links in a customer email actually go.
 *
 * They all used to point at config('app.url') — which in this deployment is
 * the JSON API, not the site. Clicking the SLS wordmark in an approval email
 * opened {"service":"SLS API","status":"ok"}, and so did the "Sign in to
 * SLS" button that is the entire point of that email.
 */
class EmailLinkTest extends TestCase
{
    use RefreshDatabase;

    private function render(string $event, array $blocks): string
    {
        config([
            'app.url' => 'https://api.sls.gr',
            'app.frontend_url' => 'https://sls.gr',
        ]);

        $mail = app(TransactionalMail::class);
        $rendered = $mail->render($event, $mail->globals());

        return (new TemplatedMail(
            subjectLine: $rendered['subject'],
            body: $rendered['body'],
            blocks: $blocks,
            vars: $mail->globals(),
            items: $mail->sampleItems(),
        ))->render();
    }

    public function test_the_sign_in_button_opens_the_site_not_the_api(): void
    {
        $html = $this->render('member.approved', ['signin_button']);

        $this->assertStringContainsString('https://sls.gr/login', $html);
        $this->assertStringNotContainsString('https://api.sls.gr', $html);
    }

    public function test_the_admin_button_opens_the_admin_screen(): void
    {
        $html = $this->render('member.approved', ['admin_button']);

        $this->assertStringContainsString('https://sls.gr/admin', $html);
        $this->assertStringNotContainsString('https://api.sls.gr', $html);
    }

    public function test_the_header_logo_opens_the_site(): void
    {
        // The stock Laravel message component links the header at app.url,
        // which is why resources/views/vendor/mail/html/message.blade.php
        // overrides it.
        $html = $this->render('member.approved', []);

        $this->assertStringNotContainsString('https://api.sls.gr', $html);
        $this->assertStringContainsString('https://sls.gr', $html);
    }
}
