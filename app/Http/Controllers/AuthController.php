<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect('/agency/dashboard');
        }

        return view('spa', ['bootstrap' => []]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            $user = Auth::user();
            $redirect = $user?->role === 'super_admin' ? '/admin/dashboard' : '/agency/dashboard';

            if ($request->expectsJson()) {
                return response()->json([
                    'redirect' => $redirect,
                    'user' => [
                        'id' => $user?->id,
                        'name' => $user?->name,
                        'email' => $user?->email,
                        'role' => $user?->role,
                    ],
                ]);
            }

            return redirect()->intended($redirect);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'The provided credentials do not match an active RIKMS account.',
            ], 422);
        }

        return back()
            ->withErrors(['email' => 'The provided credentials do not match an active RIKMS account.'])
            ->onlyInput('email');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->expectsJson()) {
            return response()->json(['redirect' => '/login']);
        }

        return redirect('/login');
    }
}
