<?php

namespace App\Console\Commands;

use App\Models\Agency;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use JsonException;
use RuntimeException;

class ProvisionRikmsTestCohort extends Command
{
    protected $signature = 'rikms:provision-test-cohort
        {manifest : Path to a private JSON manifest containing one leader and six testers}
        {--password-prefix=RIKMS_TEST_PASSWORD : Environment prefix; expects _ADMIN and _1 through _6}
        {--disable-demo : Disable the known fixed demonstration accounts}';

    protected $description = 'Provision the isolated seven-account penetration-test cohort without storing plaintext passwords';

    public function handle(): int
    {
        $manifest = $this->manifest((string) $this->argument('manifest'));
        $prefix = (string) $this->option('password-prefix');
        $credentials = [
            'admin' => $this->password($prefix.'_ADMIN'),
            ...array_map(fn (int $index) => $this->password($prefix.'_'.$index), range(1, 6)),
        ];

        DB::transaction(function () use ($manifest, $credentials): void {
            $admin = $this->upsertUser($manifest['admin'], $credentials['admin'], null, 'super_admin');
            foreach ($manifest['testers'] as $index => $tester) {
                $agency = Agency::query()->updateOrCreate(
                    ['name' => $tester['company']],
                    [
                        'abbreviation' => $tester['company_abbreviation'] ?? null,
                        'region' => $tester['region'] ?? 'RIKMS authorized penetration-test cohort',
                        'type' => 'Authorized Test Organization',
                        'contact_email' => strtolower($tester['email']),
                        'is_active' => true,
                    ],
                );
                $this->upsertUser($tester, $credentials[$index], $agency->id, 'agency_admin');
            }

            if ($this->option('disable-demo')) {
                User::query()->whereIn('email', ['test@example.com', 'admin@rikms.gov.ph'])
                    ->whereKeyNot($admin->id)
                    ->get()
                    ->each(function (User $user): void {
                        DB::table('sessions')->where('user_id', $user->id)->delete();
                        $user->forceFill([
                            'is_active' => false,
                            'password' => Str::random(64),
                            'remember_token' => Str::random(60),
                        ])->save();
                    });
            }
        });

        $this->components->info('Provisioned one super administrator and six isolated agency testers. No password was printed or stored in the manifest.');

        return self::SUCCESS;
    }

    /** @return array{admin: array{name: string, email: string}, testers: array<int, array{name: string, email: string, company: string, company_abbreviation?: string, region?: string}>} */
    private function manifest(string $path): array
    {
        if (! is_file($path) || ! is_readable($path)) {
            throw new RuntimeException('The private cohort manifest is not readable.');
        }

        try {
            $data = json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException('The cohort manifest is not valid JSON.', previous: $exception);
        }

        $validator = Validator::make($data, [
            'admin' => ['required', 'array'],
            'admin.name' => ['required', 'string', 'max:255'],
            'admin.email' => ['required', 'email:rfc', 'max:255'],
            'testers' => ['required', 'array', 'size:6'],
            'testers.*.name' => ['required', 'string', 'max:255'],
            'testers.*.email' => ['required', 'email:rfc', 'max:255', 'distinct'],
            'testers.*.company' => ['required', 'string', 'max:255', 'distinct'],
            'testers.*.company_abbreviation' => ['nullable', 'string', 'max:50'],
            'testers.*.region' => ['nullable', 'string', 'max:255'],
        ]);
        $validated = $validator->validate();
        $emails = collect($validated['testers'])->pluck('email')->map(fn ($email) => strtolower($email));
        if ($emails->contains(strtolower($validated['admin']['email']))) {
            throw new RuntimeException('The leader email must be different from all six tester emails.');
        }

        return $validated;
    }

    private function password(string $variable): string
    {
        $password = getenv($variable);
        if (! is_string($password) || $password === '') {
            throw new RuntimeException("The {$variable} environment variable is required.");
        }
        Validator::make(['password' => $password], [
            'password' => ['required', 'string', Password::defaults()],
        ])->validate();

        return $password;
    }

    /** @param array{name: string, email: string} $identity */
    private function upsertUser(array $identity, string $password, ?int $agencyId, string $role): User
    {
        $user = User::query()->updateOrCreate(
            ['email' => strtolower($identity['email'])],
            [
                'name' => $identity['name'],
                'password' => $password,
                'role' => $role,
                'agency_id' => $agencyId,
                'is_active' => true,
                'must_change_password' => true,
                'remember_token' => Str::random(60),
            ],
        );
        DB::table('sessions')->where('user_id', $user->id)->delete();

        return $user;
    }
}
