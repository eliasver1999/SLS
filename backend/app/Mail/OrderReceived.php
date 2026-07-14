<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderReceived extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        $label = match ($this->order->type) {
            'quote' => 'Quote request',
            'rental' => 'Booking request',
            default => 'Order request',
        };

        return new Envelope(
            subject: "SLS — {$label} received ({$this->order->reference})",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.orders.received',
            with: ['order' => $this->order],
        );
    }
}
