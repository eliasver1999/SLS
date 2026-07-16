<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to a member when an admin rejects their registration.
 */
class MemberRejected extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'SLS — update on your account request',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.members.rejected',
            with: ['user' => $this->user],
        );
    }
}
