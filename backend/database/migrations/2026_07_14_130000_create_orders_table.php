<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('type');   // quote | order
            $table->string('status')->default('pending'); // pending|quoted|confirmed|in_production|completed|cancelled
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('contact_name')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('company')->nullable();
            $table->json('items');    // [{slug,name,mode,qty,price}]
            $table->string('total')->nullable(); // display string, e.g. "€ 82,800"
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
