<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use RuntimeException;

class ProvisionRikmsAdmin extends Command
{
    protected $signature = 'rikms:provision-admin
        {email : Email address for the production super administrator}
        {--name=RIKMS Administrator : Display name}
        {--password-env=RIKMS_ADMIN_PASSWORD : Environment variable containing the temporary password}
        {--disable-demo : Disable seeded demonstration accounts and invalidate their sessions}';

    protected $description = 'Provision a review-gated production administrator without exposing its password';

    public function handle(): int
    {
        $passwordVariable = (string) $this->option('password-env');
        $password = getenv($passwordVariable);
        if (! is_string($password) || $password === '') {
            throw new RuntimeException("The {$passwordVariable} environment variable is required.");
        }

        $data = [
            'email' => strtolower(trim((string) $this->argument('email'))),
            'name' => trim((string) $this->option('name')),
            'password' => $password,
        ];
        Validator::make($data, [
            'email' => ['required', 'email:rfc', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', Password::defaults()],
        ])->validate();

        DB::transaction(function () use ($data): void {
            $admin = User::query()->updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => $data['password'],
                    'role' => 'super_admin',
                    'agency_id' => null,
                    'is_active' => true,
                    'must_change_password' => true,
                ]
            );

            $admin->forceFill(['remember_token' => Str::random(60)])->save();
            DB::table('sessions')->where('user_id', $admin->id)->delete();

            if ($this->option('disable-demo')) {
                $demoUsers = User::query()
                    ->whereIn('email', ['test@example.com', 'admin@rikms.gov.ph'])
                    ->whereKeyNot($admin->id)
                    ->get();
                DB::table('sessions')->whereIn('user_id', $demoUsers->pluck('id'))->delete();
                foreach ($demoUsers as $demoUser) {
                    $demoUser->forceFill([
                        'is_active' => false,
                        'password' => Hash::make(Str::random(64)),
                        'remember_token' => Str::random(60),
                    ])->save();
                }
            }
        });

        $this->components->info('RIKMS administrator provisioned; the temporary password was not printed.');

        return self::SUCCESS;
    }
}
