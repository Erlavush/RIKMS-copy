<?php

namespace App\Providers;

use App\Events\DocumentSourceStored;
use App\Jobs\ProcessDocumentJob;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Laravel\Fortify\Fortify;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // RIKMS owns its authentication routes and uses only Fortify's vetted
        // TOTP provider, recovery-code primitives, and model trait.
        Fortify::ignoreRoutes();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(DocumentSourceStored::class, function (DocumentSourceStored $event): void {
            if (! config('rikms.document_processing.auto_queue')) {
                return;
            }

            ProcessDocumentJob::dispatch($event->documentId)->onQueue('default');
        });

        PasswordRule::defaults(fn () => PasswordRule::min(14)->mixedCase()->letters()->numbers()->symbols());

        if ($this->app->environment('staging', 'production')) {
            URL::forceScheme('https');
            URL::forceRootUrl((string) config('app.url'));
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

        RateLimiter::for('public-read', fn (Request $request) => Limit::perMinute(120)->by('public-read|'.$request->ip())
        );

        RateLimiter::for('public-download', function (Request $request) {
            $limits = [Limit::perHour(30)->by('public-download-ip|'.$request->ip())];
            if ($request->filled('grant')) {
                $limits[] = Limit::perHour(10)->by('public-download-grant|'.hash('sha256', (string) $request->query('grant')));
            }

            return $limits;
        });

        RateLimiter::for('authenticated-api', fn (Request $request) => Limit::perMinute(120)->by('authenticated-api|'.$request->user()?->getAuthIdentifier())
        );

        RateLimiter::for('ai-analysis', function (Request $request) {
            return [
                Limit::perHour(10)->by('ai-analysis-user|'.$request->user()?->getAuthIdentifier()),
                Limit::perHour(30)->by('ai-analysis-agency|'.$request->user()?->agency_id),
            ];
        });

        RateLimiter::for('two-factor-challenge', function (Request $request) {
            return [
                Limit::perMinute(5)->by('two-factor-user|'.$request->session()->get('login.id').'|'.$request->ip()),
                Limit::perHour(30)->by('two-factor-ip|'.$request->ip()),
            ];
        });
    }
}
