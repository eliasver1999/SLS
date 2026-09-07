<?php

use App\Support\Money;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Money was stored as display strings ("€ 82,800"), so nothing could sum,
     * sort or invoice off it and "abc" was a valid order total. This moves
     * every amount to integer cents, records the VAT rate on the order rather
     * than assuming today's rate applies to last year's work, and backfills
     * the existing strings.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedBigInteger('buy_price_cents')->nullable()->after('modes');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('currency', 3)->default('EUR')->after('status');
            $table->unsignedBigInteger('subtotal_cents')->default(0)->after('items');
            // Snapshot: a rate change must not silently restate old orders.
            $table->unsignedTinyInteger('vat_percent')->default(0)->after('subtotal_cents');
            $table->unsignedBigInteger('vat_cents')->default(0)->after('vat_percent');
            $table->unsignedBigInteger('total_cents')->default(0)->after('vat_cents');
        });

        $this->backfillProducts();
        $this->backfillOrders();

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('total');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('total')->nullable();
            $table->dropColumn(['currency', 'subtotal_cents', 'vat_percent', 'vat_cents', 'total_cents']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('buy_price_cents');
        });
    }

    /**
     * Lift the price out of the buy JSON blob into its own integer column, so
     * there is one authoritative amount instead of a formatted duplicate.
     */
    private function backfillProducts(): void
    {
        foreach (DB::table('products')->select('id', 'buy')->get() as $row) {
            $buy = json_decode($row->buy ?? 'null', true);

            if (! is_array($buy)) {
                continue;
            }

            $cents = Money::parse($buy['price'] ?? null);
            unset($buy['price']);

            DB::table('products')->where('id', $row->id)->update([
                'buy_price_cents' => $cents,
                'buy' => json_encode($buy),
            ]);
        }
    }

    private function backfillOrders(): void
    {
        $vat = (int) config('sls.vat_percent');

        foreach (DB::table('orders')->select('id', 'items', 'total')->get() as $row) {
            $items = json_decode($row->items ?? '[]', true) ?: [];
            $subtotal = 0;

            foreach ($items as $i => $item) {
                $unit = Money::parse($item['price'] ?? null) ?? 0;
                $qty = (int) ($item['qty'] ?? 1) ?: 1;

                unset($items[$i]['price']);
                $items[$i]['unit_price_cents'] = $unit;
                $items[$i]['qty'] = $qty;
                $items[$i]['line_total_cents'] = $unit * $qty;
                $subtotal += $unit * $qty;
            }

            // Where the old hand-typed total disagreed with the lines, keep it:
            // it is what the customer was actually quoted.
            $stated = Money::parse($row->total);
            $subtotal = $stated ?? $subtotal;
            $vatCents = (int) round($subtotal * $vat / 100);

            DB::table('orders')->where('id', $row->id)->update([
                'items' => json_encode(array_values($items)),
                'subtotal_cents' => $subtotal,
                'vat_percent' => $vat,
                'vat_cents' => $vatCents,
                'total_cents' => $subtotal + $vatCents,
            ]);
        }
    }
};
