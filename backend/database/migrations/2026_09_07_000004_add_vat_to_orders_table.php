<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Snapshot the buyer's VAT number on the order, the way company already
     * is: an invoice has to show the number as it stood when the sale was
     * made, not whatever the account happens to say later.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('vat_number')->nullable()->after('company');
        });

        DB::statement(
            'UPDATE orders SET vat_number = (SELECT users.vat_number FROM users WHERE users.id = orders.user_id) WHERE vat_number IS NULL'
        );
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('vat_number');
        });
    }
};
