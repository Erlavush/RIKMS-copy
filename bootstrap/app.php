<?php

use App\Http\Controllers\HealthController;
use App\Http\Middleware\EnsurePasswordChanged;
use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\EnsureTwoFactorEnabled;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: null,
        then: function (): void {
            Route::get('/up', fn () => response()->json(['status' => 'up']))
                ->name('health.liveness');
            Route::get('/ready', HealthController::class)
                ->name('health.readiness');
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        if ($trustedProxies = env('TRUSTED_PROXIES')) {
            $middleware->trustProxies(at: $trustedProxies);
        }

        $trustedHosts = array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('TRUSTED_HOSTS', ''))
        )));
        if ($trustedHosts !== []) {
            $middleware->trustHosts(at: $trustedHosts, subdomains: false);
        }

        $middleware->append(SecurityHeaders::class);
        $middleware->alias([
            'role' => EnsureRole::class,
            'permission' => EnsurePermission::class,
            'password.changed' => EnsurePasswordChanged::class,
            'two-factor' => EnsureTwoFactorEnabled::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
