<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order, public string $previousStatus) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "SLS — {$this->order->reference} is now “{$this->statusLabel()}”",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.orders.status',
            with: [
                'order' => $this->order,
                'statusLabel' => $this->statusLabel(),
            ],
        );
    }

    public function statusLabel(): string
    {
        return ucwords(str_replace('_', ' ', $this->order->status));
    }
}
