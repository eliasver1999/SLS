<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Support\Money;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Order reporting for the admin.
 *
 * Figures are ex VAT: the tax is collected on the state's behalf and is not
 * revenue, so mixing it into a sales total would overstate the business by
 * whatever the rate happens to be.
 */
class ReportController extends Controller
{
    /** Statuses that represent work still in play. */
    private const OPEN = ['pending', 'quoted', 'confirmed', 'in_production'];

    public function orders()
    {
        $byStatus = Order::query()
            ->selectRaw('status, type, COUNT(*) as count, SUM(subtotal_cents) as cents')
            ->groupBy('status', 'type')
            ->get();

        $sum = fn (callable $filter) => $byStatus->filter($filter)->sum('cents');
        $count = fn (callable $filter) => $byStatus->filter($filter)->sum('count');

        $openCents = $sum(fn ($r) => in_array($r->status, self::OPEN, true) && $r->type === 'order');
        $wonCents = $sum(fn ($r) => $r->status === 'completed');
        $wonCount = $count(fn ($r) => $r->status === 'completed');

        return response()->json([
            'currency' => config('sls.currency'),
            'headline' => [
                // Orders still in play — the value the team is working toward.
                'pipeline_cents' => $openCents,
                'pipeline' => Money::format($openCents),
                'won_cents' => $wonCents,
                'won' => Money::format($wonCents),
                'open_count' => $count(fn ($r) => in_array($r->status, self::OPEN, true)),
                'average_order_cents' => $wonCount > 0 ? (int) round($wonCents / $wonCount) : 0,
                'average_order' => Money::format($wonCount > 0 ? (int) round($wonCents / $wonCount) : 0),
            ],
            'by_status' => $byStatus
                ->groupBy('status')
                ->map(fn ($rows, $status) => [
                    'status' => $status,
                    'count' => (int) $rows->sum('count'),
                    'cents' => (int) $rows->sum('cents'),
                    'value' => Money::format((int) $rows->sum('cents')),
                ])
                ->values(),
            'by_type' => $byStatus
                ->groupBy('type')
                ->map(fn ($rows, $type) => [
                    'type' => $type,
                    'count' => (int) $rows->sum('count'),
                    'cents' => (int) $rows->sum('cents'),
                    'value' => Money::format((int) $rows->sum('cents')),
                ])
                ->values(),
            'by_month' => $this->byMonth(),
        ]);
    }

    /**
     * Requests per month for the last six months, including months with none
     * so a quiet period reads as a gap rather than vanishing from the chart.
     *
     * @return array<int, array<string, mixed>>
     */
    private function byMonth(): array
    {
        $start = Carbon::now()->startOfMonth()->subMonths(5);

        $rows = Order::query()
            ->where('created_at', '>=', $start)
            ->selectRaw("strftime('%Y-%m', created_at) as month, COUNT(*) as count, SUM(subtotal_cents) as cents")
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        // strftime is SQLite-only; fall back for any other driver.
        if (DB::connection()->getDriverName() !== 'sqlite') {
            $rows = Order::query()
                ->where('created_at', '>=', $start)
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count, SUM(subtotal_cents) as cents")
                ->groupBy('month')
                ->get()
                ->keyBy('month');
        }

        $months = [];

        for ($i = 0; $i < 6; $i++) {
            $at = $start->copy()->addMonths($i);
            $key = $at->format('Y-m');
            $row = $rows->get($key);
            $cents = (int) ($row->cents ?? 0);

            $months[] = [
                'month' => $key,
                'label' => $at->isoFormat('MMM'),
                'count' => (int) ($row->count ?? 0),
                'cents' => $cents,
                'value' => Money::format($cents),
            ];
        }

        return $months;
    }
}
