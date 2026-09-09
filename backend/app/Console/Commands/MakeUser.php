<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

/**
 * Create or update a real account from the command line.
 *
 * Deliberately not a seeder: seeders run on every deployment, and this one
 * would put a known password on a named admin every time the container
 * restarts. This is a thing you run once, on purpose, on the machine that
 * needs the account.
 *
 * The password is prompted for rather than passed as an argument, so it does
 * not end up in shell history or in a process list.
 */
class MakeUser extends Command
{
    protected $signature = 'sls:user
        {email : The account to create or update}
        {--name= : Display name}
        {--company= : Company shown on their orders}
        {--admin : Grant admin access}';

    protected $description = 'Create or update an account, and set its password';

    public function handle(): int
    {
        $email = (string) $this->argument('email');

        $validator = Validator::make(['email' => $email], ['email' => ['required', 'email']]);

        if ($validator->fails()) {
            $this->error('That is not a valid email address.');

            return self::FAILURE;
        }

        $existing = User::where('email', $email)->first();
        $password = $this->secret('Password (leave blank to keep the current one)');

        if (! $existing && ($password === null || $password === '')) {
            $this->error('A new account needs a password.');

            return self::FAILURE;
        }

        if ($password !== null && $password !== '') {
            $check = Validator::make(['password' => $password], [
                'password' => ['required', Password::min(8)],
            ]);

            if ($check->fails()) {
                $this->error(implode(' ', $check->errors()->all()));

                return self::FAILURE;
            }
        }

        $user = User::updateOrCreate(['email' => $email], array_filter([
            'name' => $this->option('name') ?: $existing?->name ?: strstr($email, '@', true),
            'company' => $this->option('company') ?: $existing?->company,
            'role' => $this->option('admin') ? 'admin' : ($existing?->role ?? 'customer'),
            // Approved on creation: an account made by hand on the server is
            // one the team already decided to trust.
            'status' => 'approved',
            'password' => $password ?: null,
        ]));

        $this->info(sprintf(
            '%s %s (%s)',
            $existing ? 'Updated' : 'Created',
            $user->email,
            $user->role,
        ));

        return self::SUCCESS;
    }
}
