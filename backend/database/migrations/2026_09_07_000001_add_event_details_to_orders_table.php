<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Event technology is delivered to a place on a date, so an order that
     * records neither forces the team to chase the customer for the basics
     * before they can quote or schedule anything.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('event_type')->nullable()->after('company');
            $table->date('event_date')->nullable()->after('event_type');
            $table->string('venue')->nullable()->after('event_date');
            $table->text('delivery_address')->nullable()->after('venue');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['event_type', 'event_date', 'venue', 'delivery_address']);
        });
    }
};
