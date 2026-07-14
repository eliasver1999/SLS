<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('category');       // screens | lighting | sound | package
            $table->string('placement_key');  // indoor | outdoor | rental | lighting | sound | package
            $table->string('image');
            $table->json('tag');              // {en, el}
            $table->json('blurb');            // {en, el}
            $table->json('thumbs');           // [string]
            $table->json('card_specs');       // [{label:{en,el}, value:{en,el}}]
            $table->json('spec_table');       // [{label:{en,el}, value:{en,el}}]
            $table->json('modes');            // ["buy","rent"]
            $table->json('buy')->nullable();  // {price, unit:{en,el}, leadTime:{en,el}}
            $table->json('rent')->nullable(); // {price, unit:{en,el}}
            $table->boolean('featured')->default(false);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
