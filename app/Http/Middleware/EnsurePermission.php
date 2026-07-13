<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        abort_if(! $request->user(), 401, 'Authentication is required.');
        abort_unless($request->user()->hasPermission($permission), 403, 'Your role does not have the required permission.');

        return $next($request);
    }
}
