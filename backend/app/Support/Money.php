<?php

namespace App\Support;

/**
 * Money is held as an integer number of minor units (cents) everywhere.
 *
 * Floats cannot represent most decimal amounts exactly, so summing them
 * drifts — not acceptable for something that ends up on an invoice. Strings
 * are worse still: they cannot be summed, sorted or totalled at all, which is
 * where this project started.
 */
class Money
{
    /**
     * Format cents for display, e.g. 690000 → "€ 6,900".
     *
     * Whole amounts drop the decimals because equipment prices read better
     * that way; anything with cents keeps both digits.
     */
    public static function format(?int $cents, ?string $currency = null): ?string
    {
        if ($cents === null) {
            return null;
        }

        $symbol = static::symbol($currency ?? config('sls.currency'));
        $decimals = $cents % 100 === 0 ? 0 : 2;

        return $symbol.' '.number_format($cents / 100, $decimals, '.', ',');
    }

    /**
     * Read a human-typed or legacy display amount into cents.
     *
     * Handles "€ 82,800", "82800", "1.234,56" and "1,234.56": a separator
     * followed by exactly two final digits is treated as the decimal point,
     * and every other separator as digit grouping.
     */
    public static function parse(string|int|float|null $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_int($value)) {
            return $value * 100;
        }

        if (is_float($value)) {
            return (int) round($value * 100);
        }

        $digits = preg_replace('/[^\d.,]/', '', $value);

        if ($digits === '' || $digits === null) {
            return null;
        }

        if (preg_match('/^(.*)[.,](\d{2})$/', $digits, $m)) {
            $whole = preg_replace('/[^\d]/', '', $m[1]);

            return (int) (($whole === '' ? 0 : $whole) * 100) + (int) $m[2];
        }

        return (int) preg_replace('/[^\d]/', '', $digits) * 100;
    }

    private static function symbol(string $currency): string
    {
        return match (strtoupper($currency)) {
            'EUR' => '€',
            'USD' => '$',
            'GBP' => '£',
            default => strtoupper($currency),
        };
    }
}
