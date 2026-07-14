<?php

namespace Database\Seeders;

use App\Models\PartnerApplication;
use Illuminate\Database\Seeder;

class PartnerApplicationSeeder extends Seeder
{
    public function run(): void
    {
        $apps = [
            [
                'reference' => 'SLS-APP-20418',
                'company' => 'Nova Events Ltd',
                'vat' => 'EL123456789',
                'contact_name' => 'Maria Papadopoulou',
                'role' => 'Production Manager',
                'email' => 'maria@novaevents.gr',
                'phone' => '+30 210 000 0000',
                'buys' => ['screens', 'lighting'],
                'message' => 'We produce festivals & corporate events across Greece.',
                'status' => 'pending',
            ],
            [
                'reference' => 'SLS-APP-20419',
                'company' => 'Aegean AV',
                'vat' => 'EL998877665',
                'contact_name' => 'Kostas Dimou',
                'role' => 'Owner',
                'email' => 'kostas@aegeanav.gr',
                'phone' => '+30 211 111 1111',
                'buys' => ['sound', 'lighting'],
                'message' => 'AV house serving venues in the Aegean.',
                'status' => 'pending',
            ],
            [
                'reference' => 'SLS-APP-20420',
                'company' => 'Retail Screens SA',
                'vat' => 'EL445566778',
                'contact_name' => 'Elena Vlachou',
                'role' => 'Buyer',
                'email' => 'elena@retailscreens.gr',
                'phone' => '+30 210 222 2222',
                'buys' => ['screens'],
                'message' => 'Rolling out in-store LED across our shops.',
                'status' => 'pending',
            ],
        ];

        foreach ($apps as $app) {
            PartnerApplication::updateOrCreate(['reference' => $app['reference']], $app);
        }
    }
}
