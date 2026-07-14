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
            ['name' => 'SLS Admin', 'password' => 'password', 'role' => 'admin', 'company' => 'SLS']
        );

        User::updateOrCreate(
            ['email' => 'maria@novaevents.gr'],
            ['name' => 'Maria Papadopoulou', 'password' => 'password', 'role' => 'customer', 'company' => 'Nova Events Ltd']
        );
    }
}
