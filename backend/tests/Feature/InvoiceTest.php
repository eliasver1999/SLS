<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\User;
use App\Services\InvoiceIssuer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Issuing invoices.
 *
 * The order emails have always said "your Scope of Work and invoice appear
 * on your order page as we issue them" — true only when somebody
 * remembered to make a PDF and upload one. Every input already existed, so
 * the promise is kept automatically now.
 *
 * Most of what matters here is the number: it has to be unique, sequential
 * and permanent, because it is quoted on a VAT return.
 */
class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    /** 10 panels at 6,900: 69,000 ex VAT, 85,560 inc, so a 42,780 deposit. */
    private function order(string $status = 'pending'): Order
    {
        $order = Order::create([
            'user_id' => User::factory()->create(['status' => 'approved'])->id,
            'reference' => 'SLS-O-'.fake()->unique()->numberBetween(2000, 9999),
            'type' => 'order',
            'status' => $status,
            'contact_name' => 'Maria Papadopoulou',
            'contact_email' => 'maria@novaevents.gr',
            'company' => 'Nova Events',
            'vat_number' => 'EL123456789',
            'items' => [['slug' => 'aurora-p26', 'name' => 'Aurora P2.6', 'qty' => 10, 'unit_price_cents' => 690000]],
            'status_history' => [],
        ]);
        $order->recalculateTotals();
        $order->save();

        return $order->fresh();
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function setStatus(Order $order, string $status): void
    {
        Sanctum::actingAs($this->admin());
        $this->patchJson("/api/orders/{$order->id}", ['status' => $status])->assertOk();
    }

    public function test_accepting_an_order_issues_a_deposit_invoice(): void
    {
        $order = $this->order();

        $this->setStatus($order, 'confirmed');

        $invoice = Invoice::sole();
        $this->assertSame('deposit', $invoice->kind);
        $this->assertSame(4278000, $invoice->amount_cents);
        $this->assertSame(8556000, $invoice->total_cents);
    }

    public function test_the_invoice_arrives_as_a_pdf_on_the_order(): void
    {
        $order = $this->order();

        $this->setStatus($order, 'confirmed');

        $document = $order->fresh()->documents()->sole();
        $this->assertSame('invoice', $document->kind);
        $this->assertSame('application/pdf', $document->mime);
        $this->assertStringEndsWith('.pdf', $document->original_name);
        // A real PDF, not an empty file or an error page.
        $this->assertGreaterThan(1000, $document->size);
        $this->assertStringStartsWith(
            '%PDF-',
            Storage::disk('local')->get($document->path),
        );
    }

    public function test_completing_an_order_issues_an_invoice_for_what_is_left(): void
    {
        $order = $this->order();
        $this->setStatus($order, 'confirmed');
        $order->payments()->create(['amount_cents' => 4278000, 'received_on' => now()->toDateString()]);

        $this->setStatus($order->fresh(), 'completed');

        $balance = Invoice::where('kind', 'balance')->sole();
        // Only the shortfall, not a nominal half of a total already part paid.
        $this->assertSame(4278000, $balance->amount_cents);
    }

    public function test_completing_a_fully_paid_order_issues_nothing(): void
    {
        // An invoice for zero is noise in a sequence that has to stay
        // meaningful.
        $order = $this->order();
        $this->setStatus($order, 'confirmed');
        $order->payments()->create(['amount_cents' => 8556000, 'received_on' => now()->toDateString()]);

        $this->setStatus($order->fresh(), 'completed');

        $this->assertSame(0, Invoice::where('kind', 'balance')->count());
    }

    public function test_numbers_are_sequential_and_unique(): void
    {
        foreach (range(1, 3) as $i) {
            $this->setStatus($this->order(), 'confirmed');
        }

        $numbers = Invoice::orderBy('id')->pluck('number')->all();
        $year = now()->format('Y');

        $this->assertSame(["SLS-{$year}-0001", "SLS-{$year}-0002", "SLS-{$year}-0003"], $numbers);
    }

    public function test_the_same_instalment_is_never_invoiced_twice(): void
    {
        // A status can be re-saved, and an order can move back and forth
        // between confirmed and in production.
        $order = $this->order();
        $this->setStatus($order, 'confirmed');
        $this->setStatus($order->fresh(), 'in_production');
        $this->setStatus($order->fresh(), 'confirmed');

        $this->assertSame(1, Invoice::where('kind', 'deposit')->count());
        $this->assertSame(1, $order->fresh()->documents()->count());
    }

    public function test_an_invoice_keeps_its_figures_when_the_order_is_repriced(): void
    {
        // A document the customer already holds must not change under them.
        $order = $this->order();
        $this->setStatus($order, 'confirmed');
        $issued = Invoice::sole();

        Sanctum::actingAs($this->admin());
        $this->patchJson("/api/orders/{$order->id}", [
            'items' => [['slug' => 'aurora-p26', 'name' => 'Aurora P2.6', 'qty' => 10, 'unit_price_cents' => 500000]],
        ])->assertOk();

        $this->assertSame(8556000, $issued->fresh()->total_cents);
        $this->assertSame(6900000, $issued->fresh()->subtotal_cents);
    }

    public function test_the_invoice_records_who_it_bills(): void
    {
        // Copied onto the invoice, so later profile edits do not rewrite a
        // document that has already been sent.
        $order = $this->order();

        $this->setStatus($order, 'confirmed');

        $invoice = Invoice::sole();
        $this->assertSame('Nova Events', $invoice->bill_to);
        $this->assertSame('EL123456789', $invoice->bill_to_vat);
    }

    public function test_the_customer_can_download_their_invoice(): void
    {
        $order = $this->order();
        $this->setStatus($order, 'confirmed');
        $document = $order->fresh()->documents()->sole();

        Sanctum::actingAs($order->user);
        $this->get("/api/orders/{$order->id}/documents/{$document->id}")->assertOk();
    }

    public function test_another_member_cannot_download_it(): void
    {
        $order = $this->order();
        $this->setStatus($order, 'confirmed');
        $document = $order->fresh()->documents()->sole();

        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));
        $this->get("/api/orders/{$order->id}/documents/{$document->id}")->assertForbidden();
    }

    public function test_a_failed_render_does_not_block_the_status_change(): void
    {
        // The team must still be able to accept an order if the PDF
        // renderer falls over; they can re-issue the document.
        $this->mock(InvoiceIssuer::class, function ($mock) {
            $mock->shouldReceive('issue')->andThrow(new \RuntimeException('renderer exploded'));
        });

        $order = $this->order();
        $this->setStatus($order, 'confirmed');

        $this->assertSame('confirmed', $order->fresh()->status);
    }
}
