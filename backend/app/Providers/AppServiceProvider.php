<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Password-reset links must land on the SPA, not a backend route.
        ResetPassword::createUrlUsing(function (User $user, string $token) {
            $frontend = rtrim((string) config('app.frontend_url'), '/');

            return $frontend.'/reset-password?token='.$token.'&email='.urlencode($user->email);
        });
    }
}
