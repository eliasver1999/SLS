<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The order emails promise a Scope of Work and an invoice, but there was
     * nowhere to put either — the paperwork lived in someone's mailbox.
     */
    public function up(): void
    {
        Schema::create('order_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            // Who attached it, kept for the audit trail. Nulled rather than
            // cascaded so removing a staff account does not delete an order's
            // paperwork.
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('kind')->default('other'); // sow | quote | invoice | other
            // The name to hand back on download. Never used as a path.
            $table->string('original_name');
            // Generated path on the private disk.
            $table->string('path');
            $table->string('mime');
            $table->unsignedBigInteger('size');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_documents');
    }
};
