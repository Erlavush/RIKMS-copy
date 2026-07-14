<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
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
        if ($this->app->environment('staging', 'production')) {
            URL::forceScheme('https');
        }

        RateLimiter::for('login', function (Request $request) {
            return [
                Limit::perMinute(10)->by('login-ip|'.$request->ip()),
                Limit::perMinute(5)->by('login-account|'.strtolower((string) $request->input('email'))),
            ];
        });

        RateLimiter::for('public-access-request', function (Request $request) {
            return [
                Limit::perHour(30)->by('access-ip|'.$request->ip()),
                Limit::perHour(5)->by('access-requester|'.strtolower((string) $request->input('requester_email')).'|'.$request->route('document')),
            ];
        });
    }
}
