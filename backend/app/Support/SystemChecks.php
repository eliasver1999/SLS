<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Whether this deployment can actually do the things it appears to do.
 *
 * Written after a discovery worth remembering: the transactional email
 * system — admin-editable copy, order confirmations, the sales notification,
 * password reset — was complete, tested, and delivering nothing at all,
 * because MAIL_MAILER was still 'log'. Every screen looked healthy. The
 * emails went into a log file and no part of the application said so.
 *
 * A misconfiguration that silently swallows customer email is not a
 * deployment detail, it is an outage, so these checks are surfaced to the
 * admin in the app and run as a command before a release. The rule they all
 * follow: report what the system will actually do, never what it was built
 * to do.
 */
class SystemChecks
{
    /** Transports that accept mail and deliver it nowhere. */
    private const SINK_TRANSPORTS = ['log', 'array', 'null'];

    /**
     * Placeholder values that ship with the framework or an example file and
     * mean "nobody has set this yet".
     */
    private const PLACEHOLDER_HOSTS = ['example.com', 'localhost', '127.0.0.1'];

    /**
     * @return list<array{key: string, label: string, status: string, detail: string, fix: string}>
     */
    public function all(): array
    {
        return [
            $this->mailTransport(),
            $this->mailFromAddress(),
            $this->frontendUrl(),
            $this->appUrl(),
            $this->debugMode(),
            $this->documentStorage(),
        ];
    }

    /** Only the checks that are not passing, worst first. */
    public function problems(): array
    {
        $rank = ['fail' => 0, 'warn' => 1];

        return collect($this->all())
            ->filter(fn (array $check) => $check['status'] !== 'ok')
            ->sortBy(fn (array $check) => $rank[$check['status']] ?? 2)
            ->values()
            ->all();
    }

    public function passing(): bool
    {
        return $this->problems() === [];
    }

    /**
     * The one that started this. A sink transport is a hard failure even in
     * local development, because the whole point is that it is not obvious.
     */
    private function mailTransport(): array
    {
        $mailer = (string) config('mail.default');
        $transport = (string) config("mail.mailers.{$mailer}.transport", $mailer);

        if (in_array($transport, self::SINK_TRANSPORTS, true)) {
            return $this->check(
                'mail.transport',
                'Email delivery',
                'fail',
                "Nothing is being emailed. MAIL_MAILER is '{$mailer}', which writes messages to storage/logs instead of sending them — order confirmations, the sales notification and password resets are all affected.",
                'Set MAIL_MAILER=smtp with your provider’s host, port, username and password, then use the Test button on any template to confirm delivery.',
            );
        }

        $host = (string) config("mail.mailers.{$mailer}.host");

        // A local catcher takes the real SMTP path and writes the message to
        // disk. That is the right way to develop against email, and it must
        // never read as "email works" — shipping this config would be the
        // original bug wearing a different hat.
        if ($transport === 'smtp' && in_array($host, self::PLACEHOLDER_HOSTS, true)) {
            return $this->check(
                'mail.transport',
                'Email delivery',
                app()->isProduction() ? 'fail' : 'warn',
                "Mail is going to a local catcher at {$host}:".config("mail.mailers.{$mailer}.port")
                    .'. Messages are written to storage/app/mail and no recipient receives anything.',
                'Correct for development. In production, set MAIL_HOST to your provider.',
            );
        }

        if ($transport === 'smtp' && ! config("mail.mailers.{$mailer}.username")) {
            return $this->check(
                'mail.transport',
                'Email delivery',
                'warn',
                'SMTP is configured without a username, which most providers reject.',
                'Add MAIL_USERNAME and MAIL_PASSWORD, then send a test email.',
            );
        }

        return $this->check('mail.transport', 'Email delivery', 'ok', "Sending over {$transport}.", '');
    }

    /**
     * A from-address on a domain you do not control is the other way email
     * silently fails: the provider accepts it and the recipient's spam filter
     * drops it.
     */
    private function mailFromAddress(): array
    {
        $from = (string) config('mail.from.address');
        $domain = Str::afterLast($from, '@');

        if ($from === '' || in_array($domain, self::PLACEHOLDER_HOSTS, true)) {
            return $this->check(
                'mail.from',
                'Sender address',
                'fail',
                "Emails would be sent from '{$from}', which is a placeholder.",
                'Set MAIL_FROM_ADDRESS to an address on your own domain.',
            );
        }

        return $this->check(
            'mail.from',
            'Sender address',
            'ok',
            "Sending as {$from}. Confirm SPF and DKIM are published for {$domain}, or mail will be filtered as spam.",
            '',
        );
    }

    /**
     * Emails carry links back into the site, so a wrong value here produces
     * mail that looks right and goes nowhere useful.
     */
    private function frontendUrl(): array
    {
        $url = (string) config('app.frontend_url');

        if (! $this->isPublicUrl($url)) {
            return $this->check(
                'app.frontend_url',
                'Links in emails',
                app()->isProduction() ? 'fail' : 'warn',
                "Order and sign-in buttons in emails point at '{$url}', which customers cannot open.",
                'Set FRONTEND_URL to the public address of the site.',
            );
        }

        return $this->check('app.frontend_url', 'Links in emails', 'ok', "Pointing at {$url}.", '');
    }

    private function appUrl(): array
    {
        $url = (string) config('app.url');

        // A malformed APP_URL takes the whole API down on boot rather than
        // failing quietly, so this check exists to name it before a deploy.
        if (! $this->isPublicUrl($url)) {
            return $this->check(
                'app.url',
                'API address',
                'fail',
                "APP_URL is not usable ('{$url}'). A malformed value stops console commands booting at all; a local one breaks any link built from it.",
                'Set APP_URL to this API’s own public address, including https://.',
            );
        }

        return $this->check('app.url', 'API address', 'ok', "Set to {$url}.", '');
    }

    private function debugMode(): array
    {
        if (app()->isProduction() && config('app.debug')) {
            return $this->check(
                'app.debug',
                'Debug mode',
                'fail',
                'APP_DEBUG is on in production, so stack traces and configuration are exposed to anyone who triggers an error.',
                'Set APP_DEBUG=false.',
            );
        }

        return $this->check(
            'app.debug',
            'Debug mode',
            'ok',
            app()->isProduction()
                ? 'Off, as production requires.'
                : 'Only enforced in production; this is '.app()->environment().'.',
            '',
        );
    }

    /**
     * Order documents are written to the private disk. If that is not
     * writable the upload fails at the moment an admin needs it.
     */
    private function documentStorage(): array
    {
        $path = storage_path('app/private');

        if (! is_dir($path) || ! is_writable($path)) {
            return $this->check(
                'storage.documents',
                'Document storage',
                'fail',
                "Order documents cannot be written to {$path}.",
                'Create the directory and make it writable by the web server.',
            );
        }

        return $this->check('storage.documents', 'Document storage', 'ok', 'Writable.', '');
    }

    /** A public URL: absolute, and not pointing at a developer's machine. */
    private function isPublicUrl(string $url): bool
    {
        if (! filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        $host = parse_url($url, PHP_URL_HOST) ?: '';

        // Localhost is correct while developing and wrong once deployed.
        return ! app()->isProduction() || ! in_array($host, self::PLACEHOLDER_HOSTS, true);
    }

    /**
     * @return array{key: string, label: string, status: string, detail: string, fix: string}
     */
    private function check(string $key, string $label, string $status, string $detail, string $fix): array
    {
        return compact('key', 'label', 'status', 'detail', 'fix');
    }
}
