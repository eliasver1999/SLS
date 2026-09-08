<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * When this admin last looked at the activity feed.
     *
     * The feed itself is derived from records that already exist — orders,
     * enquiries, registrations — so the only state worth storing is the
     * watermark each admin has read up to. One nullable timestamp gives an
     * unread count without a notifications table that would have to be kept
     * in step with the things it describes.
     *
     * Null means "never opened it", which reads as everything unread.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('activity_seen_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('activity_seen_at');
        });
    }
};
