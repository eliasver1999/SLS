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
            ],
            [
                'reference' => 'SLS-O-1180',
                'type' => 'order',
                'status' => 'in_production',
                'items' => [['slug' => 'titan-p39', 'name' => 'Titan P3.9', 'mode' => 'buy', 'qty' => 20]],
                'total' => '€ 168,000',
            ],
            [
                'reference' => 'SLS-R-0777',
                'type' => 'rental',
                'status' => 'confirmed',
                'items' => [['slug' => 'beam-380', 'name' => 'Beam 380', 'mode' => 'rent', 'qty' => 8, 'from' => '12 Aug 2026', 'to' => '15 Aug 2026']],
                'total' => '€ 1,440',
            ],
            [
                'reference' => 'SLS-Q-2038',
                'type' => 'quote',
                'status' => 'quoted',
                'items' => [['slug' => 'stage-kit-s', 'name' => 'Stage Kit S', 'mode' => 'rent', 'qty' => 1]],
                'total' => '€ 5,800',
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
}
