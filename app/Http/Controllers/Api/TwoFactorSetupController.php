<?php

namespace App\Http\Controllers\Api;

use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Actions\ConfirmTwoFactorAuthentication;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;
use Laravel\Fortify\Actions\GenerateNewRecoveryCodes;
use Laravel\Fortify\Fortify;

class TwoFactorSetupController extends RikmsApiController
{
    public function __construct(private readonly AuditLogService $audit) {}

    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json(['data' => [
            'required' => $user->isSuperAdmin(),
            'enabled' => $user->hasEnabledTwoFactorAuthentication(),
            'pending' => ! empty($user->two_factor_secret) && empty($user->two_factor_confirmed_at),
        ]]);
    }

    public function start(Request $request, EnableTwoFactorAuthentication $enable)
    {
        $validated = $request->validate(['currentPassword' => ['required', 'string']]);
        $user = $request->user();
        if (! Hash::check($validated['currentPassword'], $user->getAuthPassword())) {
            throw ValidationException::withMessages(['currentPassword' => 'The current password is incorrect.']);
        }

        $user->forceFill(['two_factor_confirmed_at' => null])->save();
        $enable($user, true);
        $request->session()->put('two_factor.setup_verified_at', now()->timestamp);
        $user->refresh();
        $secret = Fortify::currentEncrypter()->decrypt($user->two_factor_secret);

        return response()->json(['data' => [
            'qrCodeSvg' => $user->twoFactorQrCodeSvg(),
            'secretKey' => $secret,
        ]]);
    }

    public function confirm(Request $request, ConfirmTwoFactorAuthentication $confirm)
    {
        $validated = $request->validate(['code' => ['required', 'digits:6']]);
        $this->ensureFreshSetupVerification($request);
        $user = $request->user();
        $confirm($user, $validated['code']);
        $request->session()->forget('two_factor.setup_verified_at');
        $this->audit->log('two-factor authentication enabled', null, ['_event_type' => 'security'], $request);

        return response()->json([
            'message' => 'Two-factor authentication is active.',
            'redirect' => '/admin/dashboard',
            'recoveryCodes' => $user->fresh()->recoveryCodes(),
        ]);
    }

    public function regenerate(Request $request, GenerateNewRecoveryCodes $generate)
    {
        $validated = $request->validate(['currentPassword' => ['required', 'string']]);
        $user = $request->user();
        abort_unless($user->hasEnabledTwoFactorAuthentication(), 409, 'Two-factor authentication is not active.');
        if (! Hash::check($validated['currentPassword'], $user->getAuthPassword())) {
            throw ValidationException::withMessages(['currentPassword' => 'The current password is incorrect.']);
        }

        $generate($user);
        $this->audit->log('two-factor recovery codes regenerated', null, ['_event_type' => 'security'], $request);

        return response()->json(['recoveryCodes' => $user->fresh()->recoveryCodes()]);
    }

    private function ensureFreshSetupVerification(Request $request): void
    {
        $verifiedAt = (int) $request->session()->get('two_factor.setup_verified_at', 0);
        if ($verifiedAt < now()->subMinutes(10)->timestamp) {
            throw ValidationException::withMessages([
                'currentPassword' => 'Confirm your current password again before configuring two-factor authentication.',
            ]);
        }
    }
}
