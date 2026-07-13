<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        abort_if(! $user, 401, 'Authentication is required.');
        if (! $user->is_active || ($user->role === 'agency_admin' && (! $user->agency_id || ! $user->agency?->is_active))) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson()) {
                return response()->json(['message' => 'Your account is inactive.', 'redirect' => '/login'], 401);
            }

            return redirect('/login')->withErrors(['email' => 'Your account is inactive.']);
        }
        abort_unless(in_array($user->role, $roles, true), 403, 'You are not authorized to access this area.');

        return $next($request);
    }
}
