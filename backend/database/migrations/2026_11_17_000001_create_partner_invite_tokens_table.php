<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tokens for the first-password link in the approval email (the `invites`
 * password broker, config/auth.php). Same shape as password_reset_tokens,
 * kept apart so the two kinds of link cannot stand in for each other.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_invite_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_invite_tokens');
    }
};
