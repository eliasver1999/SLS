<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            // Event key from config/emails.php, e.g. "order.status.confirmed".
            $table->string('event')->unique();
            $table->string('subject');
            $table->text('body');
            // Structural blocks the admin switched on, e.g. ["items_table"].
            $table->json('blocks')->nullable();
            $table->boolean('enabled')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
