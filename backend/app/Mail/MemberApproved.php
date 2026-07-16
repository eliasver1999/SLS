<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to a member when an admin approves their registration — pricing, cart
 * and ordering are now unlocked.
 */
class MemberApproved extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'SLS — your account is approved',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.members.approved',
            with: ['user' => $this->user],
        );
    }
}
