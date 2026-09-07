<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pixel pitch existed only as display text inside the spec table ("2.6
     * mm"), which the catalogue's pitch filter could not sort or compare —
     * so the filter was decorative markup. A number can be filtered on.
     *
     * Nullable because it is meaningless for lighting and sound.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('pitch_mm', 5, 2)->nullable()->after('placement_key');
        });

        foreach (DB::table('products')->select('id', 'spec_table', 'card_specs')->get() as $row) {
            $pitch = $this->pitchFrom($row->spec_table) ?? $this->pitchFrom($row->card_specs);

            if ($pitch !== null) {
                DB::table('products')->where('id', $row->id)->update(['pitch_mm' => $pitch]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('pitch_mm');
        });
    }

    /**
     * Pull the first millimetre figure out of a spec array, whether the label
     * reads "Pixel pitch" or just "Pitch".
     */
    private function pitchFrom(?string $json): ?float
    {
        foreach (json_decode($json ?? '[]', true) ?: [] as $spec) {
            $label = strtolower($spec['label']['en'] ?? '');

            if (! str_contains($label, 'pitch')) {
                continue;
            }

            if (preg_match('/([\d.]+)\s*mm/i', $spec['value']['en'] ?? '', $m)) {
                return (float) $m[1];
            }
        }

        return null;
    }
};
