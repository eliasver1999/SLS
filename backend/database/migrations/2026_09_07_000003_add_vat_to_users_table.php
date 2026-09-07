<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A VAT number was collected on the public application form and then left
     * there — the approved account it belongs to had no record of it, so the
     * number needed for a Greek B2B invoice was not reachable from the order
     * it had to appear on.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('vat_number')->nullable()->after('company');
        });

        // Carry across anything already gathered by an approved application.
        foreach (DB::table('partner_applications')->whereNotNull('vat')->get() as $application) {
            DB::table('users')
                ->where('email', $application->email)
                ->whereNull('vat_number')
                ->update(['vat_number' => $application->vat]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('vat_number');
        });
    }
};
