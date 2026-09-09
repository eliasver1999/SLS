<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * What the customer agreed to when they submitted.
     *
     * There is now one way in: a customer places an order at the prices they
     * can see, and the team accepts it. The team may discount — nobody
     * disputes paying less, so that needs no further agreement.
     *
     * This column is what makes the other direction safe. It records the
     * figure the customer actually saw, so the system can tell a discount
     * from a price rise and refuse to confirm the second one behind their
     * back.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('agreed_total_cents')->nullable()->after('total_cents');
        });

        // Existing rows: the current total is the best available record of
        // what was agreed, and it stops old orders looking like price rises.
        DB::table('orders')->update(['agreed_total_cents' => DB::raw('total_cents')]);
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('agreed_total_cents');
        });
    }
};
