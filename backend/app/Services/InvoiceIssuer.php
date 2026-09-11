<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderDocument;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Issues the invoices the order emails have always promised.
 *
 * "Your Scope of Work and invoice appear on your order page as we issue
 * them" was true only when somebody remembered to make a PDF and upload
 * it. Every input already existed — the lines, the VAT rate, the deposit
 * split, the customer's VAT number, the bank details — so the promise is
 * kept automatically now.
 *
 * Two invoices per order: the deposit on acceptance, the balance on
 * completion. The PDF is written through the existing document store, so
 * it inherits the private disk and the ownership-checked download rather
 * than needing a second way to hand a file to a customer.
 */
class InvoiceIssuer
{
    /**
     * Issue an invoice for one instalment, unless it already exists.
     *
     * Idempotent on purpose: a status can be re-saved, and an order that
     * bounces between confirmed and in_production must not mint a second
     * deposit invoice with a second number.
     */
    public function issue(Order $order, string $kind, ?User $by = null): ?Invoice
    {
        if (! in_array($kind, ['deposit', 'balance'], true)) {
            return null;
        }

        $existing = Invoice::where('order_id', $order->id)->where('kind', $kind)->first();

        if ($existing) {
            return $existing;
        }

        $amount = $this->amountFor($order, $kind);

        // Nothing to bill — a fully paid order being completed, or a
        // zero-value order. An invoice for nothing is noise in an
        // accounting sequence that has to stay meaningful.
        if ($amount <= 0) {
            return null;
        }

        $invoice = Invoice::create([
            'number' => Invoice::nextNumber(),
            'order_id' => $order->id,
            'kind' => $kind,
            'issued_on' => now()->toDateString(),
            // Copied, not referenced: repricing the order later must not
            // change a document the customer already holds.
            'currency' => $order->currency,
            'subtotal_cents' => (int) $order->subtotal_cents,
            'vat_percent' => (int) $order->vat_percent,
            'vat_cents' => (int) $order->vat_cents,
            'total_cents' => (int) $order->total_cents,
            'amount_cents' => $amount,
            'lines' => $order->items ?? [],
            'bill_to' => $order->company ?: (string) $order->contact_name,
            'bill_to_vat' => $order->vat_number,
            'bill_to_email' => $order->contact_email,
            'issued_by' => $by?->id,
        ]);

        $this->attachPdf($order, $invoice, $by);

        return $invoice;
    }

    /**
     * What this instalment asks for.
     *
     * The deposit is its share of the total; the balance is whatever is
     * genuinely left once recorded payments are taken off, so completing a
     * part-paid order bills the shortfall rather than a nominal half.
     */
    private function amountFor(Order $order, string $kind): int
    {
        return $kind === 'deposit'
            ? TransactionalMail::depositCents($order)
            : $order->outstandingCents();
    }

    /**
     * Render the PDF and file it against the order.
     */
    private function attachPdf(Order $order, Invoice $invoice, ?User $by): void
    {
        $pdf = Pdf::loadView('documents.invoice', [
            'invoice' => $invoice,
            'order' => $order,
        ])
            ->setPaper('a4')
            // Embed only the glyphs used. Without it every invoice carries
            // the whole DejaVu face — 860KB for one page of text — and the
            // font is not negotiable: a Greek company name or a € sign has
            // to render, which rules out the built-in Latin-only faces.
            ->setOption('isFontSubsettingEnabled', true);

        $name = $invoice->number.'.pdf';
        $path = "order-documents/{$order->id}/".Str::uuid().'.pdf';

        Storage::disk('local')->put($path, $pdf->output());

        $order->documents()->create([
            'uploaded_by' => $by?->id,
            'kind' => 'invoice',
            'original_name' => $name,
            'path' => $path,
            'mime' => 'application/pdf',
            'size' => Storage::disk('local')->size($path),
        ]);
    }

    /**
     * Remove an invoice and its file.
     *
     * Only for a document issued in error and never sent — a number that
     * has left the building should be credited, not deleted. The admin UI
     * does not expose this; it exists so a failed render can be cleaned up.
     */
    public function discard(Invoice $invoice): void
    {
        OrderDocument::where('order_id', $invoice->order_id)
            ->where('original_name', $invoice->number.'.pdf')
            ->get()
            ->each(function (OrderDocument $document) {
                Storage::disk('local')->delete($document->path);
                $document->delete();
            });

        $invoice->delete();
    }
}
