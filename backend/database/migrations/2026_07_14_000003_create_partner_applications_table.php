<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_applications', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('company');
            $table->string('vat')->nullable();
            $table->string('contact_name');
            $table->string('role')->nullable();
            $table->string('email');
            $table->string('phone')->nullable();
            $table->json('buys')->nullable();   // ["screens","lighting",...]
            $table->text('message')->nullable();
            $table->string('status')->default('pending'); // pending | approved | rejected
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_applications');
    }
};
