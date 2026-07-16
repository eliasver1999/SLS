<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'maria@novaevents.gr')->first();
        if (! $customer) {
            return;
        }

        $orders = [
            [
                'reference' => 'SLS-Q-2041',
                'type' => 'quote',
                'status' => 'pending',
                'items' => [['slug' => 'aurora-p26', 'name' => 'Aurora P2.6', 'mode' => 'buy', 'qty' => 12]],
                'total' => '€ 82,800',
                'status_history' => $this->history([
                    ['pending', null, '2026-07-10T09:15:00+00:00', $customer->name],
                ]),
            ],
            [
                'reference' => 'SLS-O-1180',
                'type' => 'order',
                'status' => 'in_production',
                'items' => [['slug' => 'titan-p39', 'name' => 'Titan P3.9', 'mode' => 'buy', 'qty' => 20]],
                'total' => '€ 168,000',
                'status_history' => $this->history([
                    ['pending', null, '2026-07-02T11:00:00+00:00', $customer->name],
                    ['confirmed', 'SOW signed — thank you!', '2026-07-04T14:20:00+00:00', 'SLS Admin'],
                    ['in_production', 'Panels in fabrication, on track for the 20th.', '2026-07-08T10:05:00+00:00', 'SLS Admin'],
                ]),
            ],
            [
                'reference' => 'SLS-Q-2038',
                'type' => 'quote',
                'status' => 'quoted',
                'items' => [['slug' => 'stage-kit-s', 'name' => 'Stage Kit S', 'qty' => 1]],
                'total' => '€ 5,800',
                'status_history' => $this->history([
                    ['pending', null, '2026-07-06T16:40:00+00:00', $customer->name],
                    ['quoted', 'Quote attached — valid for 30 days.', '2026-07-07T09:30:00+00:00', 'SLS Admin'],
                ]),
            ],
        ];

        foreach ($orders as $o) {
            Order::updateOrCreate(
                ['reference' => $o['reference']],
                $o + [
                    'user_id' => $customer->id,
                    'contact_name' => $customer->name,
                    'contact_email' => $customer->email,
                    'company' => $customer->company,
                ]
            );
        }
    }

    /**
     * Build status-history rows from [status, note, at, by] tuples.
     *
     * @param  array<int, array{0:string,1:?string,2:string,3:string}>  $rows
     * @return array<int, array<string, mixed>>
     */
    private function history(array $rows): array
    {
        return array_map(fn ($r) => [
            'status' => $r[0],
            'note' => $r[1],
            'at' => $r[2],
            'by' => $r[3],
        ], $rows);
    }
}
