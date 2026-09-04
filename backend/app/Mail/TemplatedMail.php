<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Carries an admin-authored subject/body (already interpolated by
 * TransactionalMail) into the shared mail layout. The body is echoed escaped
 * in the view, so admin copy renders as markdown but cannot inject markup.
 */
class TemplatedMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<int, string>  $blocks
     * @param  array<string, mixed>  $vars
     * @param  array<int, array<string, mixed>>  $items
     */
    public function __construct(
        public string $subjectLine,
        public string $body,
        public array $blocks = [],
        public array $vars = [],
        public array $items = [],
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subjectLine);
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.templated');
    }
}
