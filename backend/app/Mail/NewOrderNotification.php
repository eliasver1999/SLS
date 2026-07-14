<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewOrderNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New {$this->order->type} — {$this->order->reference} ({$this->order->company})",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.orders.admin-notify',
            with: ['order' => $this->order],
        );
    }
}
