<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@sls.gr'],
            ['name' => 'SLS Admin', 'password' => 'password', 'role' => 'admin', 'company' => 'SLS', 'status' => 'approved']
        );

        User::updateOrCreate(
            ['email' => 'maria@novaevents.gr'],
            ['name' => 'Maria Papadopoulou', 'password' => 'password', 'role' => 'customer', 'company' => 'Nova Events Ltd', 'vat_number' => 'EL123456789', 'status' => 'approved']
        );

        // A pending registration so the admin Members approvals screen has
        // something to act on out of the box.
        User::updateOrCreate(
            ['email' => 'nikos@stagepro.gr'],
            ['name' => 'Nikos Georgiou', 'password' => 'password', 'role' => 'customer', 'company' => 'StagePro EPE', 'status' => 'pending']
        );
    }
}
