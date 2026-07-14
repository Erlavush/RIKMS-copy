<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Crypt;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    protected function withConfirmedTwoFactor(User $user): User
    {
        $user->forceFill([
            'two_factor_secret' => Crypt::encrypt('JBSWY3DPEHPK3PXP'),
            'two_factor_recovery_codes' => Crypt::encrypt(json_encode(['test-recovery-code'])),
            'two_factor_confirmed_at' => now(),
        ])->save();

        return $user->fresh();
    }
}
