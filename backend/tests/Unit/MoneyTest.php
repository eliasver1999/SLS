<?php

namespace Tests\Unit;

use App\Support\Money;
use Tests\TestCase;

class MoneyTest extends TestCase
{
    public function test_it_formats_whole_and_fractional_amounts(): void
    {
        $this->assertSame('€ 6,900', Money::format(690000));
        $this->assertSame('€ 102,672', Money::format(10267200));
        $this->assertSame('€ 1,234.56', Money::format(123456));
        $this->assertSame('€ 0', Money::format(0));
        $this->assertNull(Money::format(null));
    }

    public function test_it_parses_the_display_strings_money_used_to_be_stored_as(): void
    {
        $this->assertSame(690000, Money::parse('€ 6,900'));
        $this->assertSame(8280000, Money::parse('€ 82,800'));
        $this->assertSame(690000, Money::parse('6900'));
        $this->assertNull(Money::parse(null));
        $this->assertNull(Money::parse(''));
    }

    public function test_it_treats_two_trailing_digits_after_a_separator_as_cents(): void
    {
        // Both European and Anglo groupings appear in typed input.
        $this->assertSame(123456, Money::parse('1.234,56'));
        $this->assertSame(123456, Money::parse('1,234.56'));
        $this->assertSame(50, Money::parse('0.50'));
    }

    public function test_a_round_trip_does_not_lose_the_amount(): void
    {
        foreach ([0, 1, 50, 690000, 8280000, 10267200, 123456] as $cents) {
            $this->assertSame($cents, Money::parse(Money::format($cents)), "round trip failed for {$cents}");
        }
    }
}
