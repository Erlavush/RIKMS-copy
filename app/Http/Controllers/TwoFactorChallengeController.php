<?php

namespace App\Http\Controllers;

use App\Models\AuthenticationEvent;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Http\Requests\TwoFactorLoginRequest;

class TwoFactorChallengeController extends Controller
{
    public function __construct(private readonly AuditLogService $audit) {}

    public function store(TwoFactorLoginRequest $request)
    {
        if ((int) $request->session()->get('login.expires_at', 0) < now()->timestamp) {
            $request->session()->forget(['login.id', 'login.remember', 'login.expires_at']);
            throw ValidationException::withMessages(['code' => 'The authentication challenge expired. Sign in again.']);
        }

        $user = $request->challengedUser();
        if (! $user instanceof User || ! $user->is_active || ! $user->isSuperAdmin()
            || ! $user->hasEnabledTwoFactorAuthentication()) {
            $request->session()->forget(['login.id', 'login.remember', 'login.expires_at']);
            throw ValidationException::withMessages(['code' => 'The authentication challenge is invalid. Sign in again.']);
        }

        $recoveryCode = $request->validRecoveryCode();
        if ($recoveryCode) {
            $user->replaceRecoveryCode($recoveryCode);
        } elseif (! $request->hasValidCode()) {
            AuthenticationEvent::create([
                'user_id' => $user->id,
                'email' => $user->email,
                'successful' => false,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'failure_reason' => 'invalid_two_factor_code',
            ]);
            throw ValidationException::withMessages(['code' => 'The authentication code is invalid.']);
        }

        $remember = $request->remember();
        $request->session()->forget('login.expires_at');
        Auth::login($user, $remember);
        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now(), 'last_login_ip' => $request->ip()])->save();
        AuthenticationEvent::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'successful' => true,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'failure_reason' => null,
        ]);
        $this->audit->log('user logged in with two-factor authentication', null, [
            '_event_type' => 'security',
            'recovery_code_used' => $recoveryCode !== null,
        ], $request);

        return response()->json([
            'redirect' => $user->must_change_password ? '/change-password' : '/admin/dashboard',
        ]);
    }
}
