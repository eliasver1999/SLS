<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Errors, grouped, where they will survive a restart.
     *
     * Until now a 500 during checkout went to storage/logs/laravel.log — on
     * an ephemeral disk, so a restart erased it — and nobody was watching the
     * file anyway. The first the team knew of a broken order was a phone
     * call, if the customer bothered to make one.
     *
     * Rows are groups, not occurrences: identical crashes collapse onto one
     * fingerprint and increment a counter, so a failure in a loop cannot bury
     * the twenty other things that broke today.
     */
    public function up(): void
    {
        Schema::create('error_events', function (Blueprint $table) {
            $table->id();
            // Type, file and line — not the message, which often carries an
            // id or a value and would split one bug into hundreds of rows.
            $table->string('fingerprint')->unique();
            $table->string('source')->default('api');  // api | client
            $table->string('type');                    // exception or error class
            $table->text('message');
            $table->string('file')->nullable();
            $table->integer('line')->nullable();
            $table->string('method')->nullable();
            $table->text('url')->nullable();
            $table->text('trace')->nullable();
            // Whose session hit it, when there was one. Kept as a reference
            // rather than a copy of their details.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->json('context')->nullable();
            $table->unsignedInteger('occurrences')->default(1);
            $table->timestamp('first_seen_at');
            $table->timestamp('last_seen_at');
            // Set when someone has dealt with it. A resolved group that
            // happens again reopens itself.
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['resolved_at', 'last_seen_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('error_events');
    }
};
