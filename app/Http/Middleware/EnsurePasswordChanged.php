<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->must_change_password) {
            return new JsonResponse([
                'message' => 'You must change your temporary password before continuing.',
                'redirect' => '/change-password',
            ], 409);
        }

        return $next($request);
    }
}
