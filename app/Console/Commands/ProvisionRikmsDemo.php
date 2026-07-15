<?php

namespace App\Console\Commands;

use App\Models\Agency;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProvisionRikmsDemo extends Command
{
    protected $signature = 'rikms:provision-demo';

    protected $description = 'Provision the fixed local demonstration accounts';

    public function handle(): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->components->error('Demo accounts can only be provisioned in the local or testing environment.');

            return self::FAILURE;
        }

        DB::transaction(function (): void {
            $agency = Agency::query()->updateOrCreate(
                ['name' => 'Department of Science and Technology - Region XI'],
                [
                    'abbreviation' => 'DOST XI',
                    'region' => 'Davao Region - RIKMS XI',
                    'type' => 'Government Agency',
                    'contact_email' => 'owner@agency.gov.ph',
                    'is_active' => true,
                ],
            );

            $agencyAdmin = User::query()->updateOrCreate(
                ['email' => 'test@example.com'],
                [
                    'name' => 'Demo Agency Admin',
                    'password' => 'password',
                    'role' => 'agency_admin',
                    'agency_id' => $agency->id,
                    'is_active' => true,
                    'must_change_password' => false,
                ],
            );

            $superAdmin = User::query()->updateOrCreate(
                ['email' => 'admin@rikms.gov.ph'],
                [
                    'name' => 'Demo Super Admin',
                    'password' => 'password',
                    'role' => 'super_admin',
                    'agency_id' => null,
                    'is_active' => true,
                    'must_change_password' => false,
                ],
            );

            foreach ([$agencyAdmin, $superAdmin] as $demoUser) {
                $demoUser->forceFill([
                    'remember_token' => Str::random(60),
                    'two_factor_secret' => null,
                    'two_factor_recovery_codes' => null,
                    'two_factor_confirmed_at' => null,
                ])->save();
            }

            DB::table('sessions')->whereIn('user_id', [$agencyAdmin->id, $superAdmin->id])->delete();
        });

        $this->components->info('Local RIKMS demonstration accounts are ready.');
        $this->line('Agency administrator: test@example.com / password');
        $this->line('Super administrator: admin@rikms.gov.ph / password');

        return self::SUCCESS;
    }
}
