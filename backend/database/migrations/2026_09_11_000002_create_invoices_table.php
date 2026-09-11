<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Issued invoices.
     *
     * The order emails promised "your Scope of Work and invoice appear on
     * your order page as we issue them", which was true only if somebody
     * remembered to make a PDF and upload it. Every input already existed:
     * the lines, the VAT rate, the deposit split, the customer's VAT
     * number, the bank details.
     *
     * This table exists for the number rather than the file. An invoice
     * number has to be unique, sequential and permanent — it is quoted on a
     * VAT return — so it cannot be derived from the order id or regenerated
     * on demand. The PDF is a rendering of this row and can be rebuilt; the
     * row cannot.
     */
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            // The human number, e.g. SLS-2026-0007. Unique for the life of
            // the business, never reused, never renumbered.
            $table->string('number')->unique();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            // Which instalment this bills: the deposit, or what is left.
            $table->string('kind');
            $table->date('issued_on');

            // The figures are copied, not looked up. An invoice is a
            // statement of what was charged on the day it was issued — if
            // the order is repriced afterwards, the invoice already sent to
            // a customer must not silently change with it.
            $table->string('currency', 3);
            $table->integer('subtotal_cents');
            $table->integer('vat_percent');
            $table->integer('vat_cents');
            $table->integer('total_cents');
            // What this particular invoice asks for, which for a deposit is
            // a fraction of the total above.
            $table->integer('amount_cents');
            $table->json('lines');
            // The customer's details as they stood, for the same reason.
            $table->string('bill_to');
            $table->string('bill_to_vat')->nullable();
            $table->string('bill_to_email')->nullable();

            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['order_id', 'kind']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
