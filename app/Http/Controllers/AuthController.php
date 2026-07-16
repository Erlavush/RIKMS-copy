<?php

namespace App\Http\Controllers;

use App\Models\AuthenticationEvent;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Events\TwoFactorAuthenticationChallenged;

class AuthController extends Controller
{
    /**
     * A real bcrypt hash keeps unknown-account checks on the same verifier path
     * without relying on a malformed placeholder that newer hashers reject.
     */
    private const UNKNOWN_ACCOUNT_HASH = '$2y$12$YKMC5qbJkyr4THo4iee9lOYFDB8OsxBHChcPP7tzo50OOGWVN27nm';

    public function __construct(private readonly AuditLogService $audit) {}

    public function showLogin()
    {
        if (Auth::check()) {
            return redirect('/agency/dashboard');
        }

        return view('spa', ['bootstrap' => []]);
    }

    public function login(Request $request)
    {
        if ($current = $request->user()) {
            if ($current->is_active && (! $current->agency_id || $current->agency?->is_active)) {
                return response()->json([
                    'redirect' => $current->must_change_password ? '/change-password' : ($current->isSuperAdmin() ? '/admin/dashboard' : '/agency/dashboard'),
                ]);
            }
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'agency_id' => ['nullable', 'integer', 'exists:agencies,id'],
        ]);

        $remember = $request->boolean('remember');
        unset($credentials['agency_id']);
        $credentials['email'] = strtolower($credentials['email']);

        $candidate = User::query()->where('email', $credentials['email'])->first();

        $passwordValid = Hash::check($credentials['password'], $candidate?->getAuthPassword() ?? self::UNKNOWN_ACCOUNT_HASH);
        if (! $candidate || ! $passwordValid) {
            $this->recordAttempt($request, $candidate, false, 'invalid_credentials');
            throw ValidationException::withMessages(['email' => 'The provided credentials do not match an active RIKMS account.']);
        }

        if (! $candidate->is_active || ($candidate->agency_id && ! $candidate->agency?->is_active)) {
            $this->recordAttempt($request, $candidate, false, 'inactive_account');
            throw ValidationException::withMessages(['email' => 'This RIKMS account or its agency is inactive.']);
        }

        if ($request->filled('agency_id') && (int) $candidate->agency_id !== (int) $request->integer('agency_id')) {
            $this->recordAttempt($request, $candidate, false, 'agency_mismatch');
            throw ValidationException::withMessages(['agency_id' => 'The selected agency does not match this account.']);
        }

        if (Hash::needsRehash($candidate->getAuthPassword())) {
            $candidate->forceFill(['password' => Hash::make($credentials['password'])])->save();
        }

        if ($candidate->isSuperAdmin() && $candidate->hasEnabledTwoFactorAuthentication()) {
            $request->session()->regenerate();
            $request->session()->put([
                'login.id' => $candidate->id,
                'login.remember' => $remember,
                'login.expires_at' => now()->addMinutes(5)->timestamp,
            ]);
            TwoFactorAuthenticationChallenged::dispatch($candidate);

            if ($request->expectsJson()) {
                return response()->json([
                    'twoFactorRequired' => true,
                    'redirect' => '/two-factor-challenge',
                ]);
            }

            return redirect('/two-factor-challenge');
        }

        Auth::login($candidate, $remember);
        if (Auth::check()) {
            $request->session()->regenerate();

            $user = Auth::user();
            $user?->forceFill(['last_login_at' => now(), 'last_login_ip' => $request->ip()])->save();
            $this->recordAttempt($request, $user, true);
            $this->audit->log('user logged in', null, ['_event_type' => 'security'], $request);
            $redirect = $user?->must_change_password
                ? '/change-password'
                : ($user?->role === 'super_admin' ? '/admin/dashboard' : '/agency/dashboard');

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

        throw ValidationException::withMessages(['email' => 'The provided credentials do not match an active RIKMS account.']);
    }

    public function logout(Request $request)
    {
        $this->audit->log('user logged out', null, ['_event_type' => 'security'], $request);
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->expectsJson()) {
            return response()->json(['redirect' => '/login']);
        }

        return redirect('/login');
    }

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate(['email' => ['required', 'email:rfc', 'max:255']]);
        $email = strtolower($validated['email']);
        $user = User::query()->where('email', $email)->first();
        if ($user?->is_active && (! $user->agency_id || $user->agency?->is_active)) {
            Password::sendResetLink(['email' => $email]);
        }

        return response()->json([
            'message' => 'If an active account matches that email address, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'password' => ['required', 'string', 'confirmed', PasswordRule::defaults()],
        ]);
        $validated['email'] = strtolower($validated['email']);

        $status = Password::reset($validated, function (User $user, string $password): void {
            abort_unless($user->is_active, 403, 'This account is inactive.');
            $user->forceFill([
                'password' => Hash::make($password),
                'must_change_password' => false,
                'remember_token' => Str::random(60),
            ])->save();
            DB::table('sessions')->where('user_id', $user->id)->delete();
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => __($status)]);
        }

        return response()->json(['message' => 'Your password has been reset. You can now sign in.']);
    }

    private function recordAttempt(Request $request, ?User $user, bool $successful, ?string $reason = null): void
    {
        AuthenticationEvent::create([
            'user_id' => $user?->id,
            'email' => strtolower((string) $request->input('email')),
            'successful' => $successful,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'failure_reason' => $reason,
        ]);
    }
}
