<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Rent has been removed for now — products are buy / quote only.
        // Guarded so a fresh install (where the create migration no longer adds
        // the column) skips cleanly, while existing databases get it dropped.
        if (Schema::hasColumn('products', 'rent')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('rent');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('products', 'rent')) {
            Schema::table('products', function (Blueprint $table) {
                $table->json('rent')->nullable()->after('buy');
            });
        }
    }
};
