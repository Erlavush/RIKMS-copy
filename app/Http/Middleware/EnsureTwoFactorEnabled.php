<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTwoFactorEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user?->isSuperAdmin() && ! $user->hasEnabledTwoFactorAuthentication()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Two-factor authentication must be configured before using administration APIs.',
                    'redirect' => '/two-factor/setup',
                ], 409);
            }

            return redirect('/two-factor/setup');
        }

        return $next($request);
    }
}
