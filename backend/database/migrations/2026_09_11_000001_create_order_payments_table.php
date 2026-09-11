<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Money actually received against an order.
     *
     * The application could say what was *due* — a deposit on acceptance, a
     * balance on completion — but had no idea what had arrived. So the
     * completion email told everyone "the remaining amount is now due",
     * including customers who had already paid in full, and the team had to
     * open a bank statement to answer "who owes us money?".
     *
     * A row rather than a paid_at column on the order: a payment has an
     * amount and a date, there is routinely more than one, and a part
     * payment against a deposit has to be representable. Two columns would
     * have to be rewritten the first time someone pays in three goes.
     */
    public function up(): void
    {
        Schema::create('order_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            // Integer cents, like every other amount in the system — a float
            // here would drift the moment it was summed.
            $table->integer('amount_cents');
            // The date the money landed, which is rarely the date someone
            // got round to recording it.
            $table->date('received_on');
            $table->string('method')->default('transfer');
            // The bank reference, so a row can be traced to a statement line.
            $table->string('reference')->nullable();
            $table->string('note')->nullable();
            // Who keyed it in. A figure that changes what a customer is
            // asked for should be attributable.
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['order_id', 'received_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_payments');
    }
};
