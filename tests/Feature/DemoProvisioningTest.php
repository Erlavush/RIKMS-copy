<?php

namespace Tests\Feature;

use App\Models\Agency;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DemoProvisioningTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_command_provisions_reusable_local_accounts(): void
    {
        $this->artisan('rikms:provision-demo')
            ->expectsOutputToContain('Local RIKMS demonstration accounts are ready.')
            ->assertSuccessful();

        $agency = Agency::query()
            ->where('name', 'Department of Science and Technology - Region XI')
            ->firstOrFail();
        $agencyAdmin = User::query()->where('email', 'test@example.com')->firstOrFail();
        $superAdmin = User::query()->where('email', 'admin@rikms.gov.ph')->firstOrFail();

        $this->assertSame('agency_admin', $agencyAdmin->role);
        $this->assertSame($agency->id, $agencyAdmin->agency_id);
        $this->assertTrue($agencyAdmin->is_active);
        $this->assertFalse($agencyAdmin->must_change_password);
        $this->assertTrue(Hash::check('password', $agencyAdmin->password));

        $this->assertSame('super_admin', $superAdmin->role);
        $this->assertNull($superAdmin->agency_id);
        $this->assertTrue($superAdmin->is_active);
        $this->assertFalse($superAdmin->must_change_password);
        $this->assertNull($superAdmin->two_factor_confirmed_at);
        $this->assertTrue(Hash::check('password', $superAdmin->password));

        DB::table('sessions')->insert([
            'id' => 'demo-session',
            'user_id' => $agencyAdmin->id,
            'payload' => 'stale',
            'last_activity' => now()->timestamp,
        ]);
        $agencyAdmin->forceFill(['is_active' => false, 'password' => 'changed-password'])->save();
        $superAdmin->forceFill([
            'two_factor_secret' => 'stale-secret',
            'two_factor_recovery_codes' => 'stale-recovery-codes',
            'two_factor_confirmed_at' => now(),
        ])->save();

        $this->artisan('rikms:provision-demo')->assertSuccessful();

        $this->assertTrue($agencyAdmin->fresh()->is_active);
        $this->assertTrue(Hash::check('password', $agencyAdmin->fresh()->password));
        $this->assertNull($superAdmin->fresh()->two_factor_secret);
        $this->assertNull($superAdmin->fresh()->two_factor_recovery_codes);
        $this->assertNull($superAdmin->fresh()->two_factor_confirmed_at);
        $this->assertDatabaseMissing('sessions', ['id' => 'demo-session']);
        $this->assertSame(2, User::query()->whereIn('email', [
            'test@example.com',
            'admin@rikms.gov.ph',
        ])->count());
    }

    public function test_demo_command_refuses_non_local_environments(): void
    {
        foreach (['test@example.com', 'admin@rikms.gov.ph'] as $email) {
            User::query()->updateOrCreate(['email' => $email], [
                'name' => 'Production sentinel',
                'password' => 'production-sentinel-password',
                'role' => 'super_admin',
                'agency_id' => null,
                'is_active' => false,
                'must_change_password' => true,
            ]);
        }

        $originalEnvironment = $this->app->environment();
        $this->app['env'] = 'production';

        try {
            $this->artisan('rikms:provision-demo')
                ->expectsOutputToContain('Demo accounts can only be provisioned')
                ->assertFailed();
        } finally {
            $this->app['env'] = $originalEnvironment;
        }

        foreach (['test@example.com', 'admin@rikms.gov.ph'] as $email) {
            $user = User::query()->where('email', $email)->firstOrFail();
            $this->assertFalse($user->is_active);
            $this->assertTrue($user->must_change_password);
            $this->assertTrue(Hash::check('production-sentinel-password', $user->password));
        }
    }
}
