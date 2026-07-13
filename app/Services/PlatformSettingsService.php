<?php

namespace App\Services;

use App\Models\PlatformSetting;
use Illuminate\Support\Facades\DB;

class PlatformSettingsService
{
    private const DEFAULTS = [
        'site_name' => 'RIKMS',
        'support_email' => null,
        'allow_public_browse' => true,
        'access_grant_days' => 7,
        'announcement' => null,
    ];

    public function all(): array
    {
        $stored = PlatformSetting::query()->whereIn('key', array_keys(self::DEFAULTS))
            ->get()->mapWithKeys(fn (PlatformSetting $setting) => [$setting->key => $setting->value['value'] ?? null])->all();

        return array_replace(self::DEFAULTS, $stored);
    }

    public function get(string $key): mixed
    {
        return $this->all()[$key] ?? null;
    }

    public function update(array $values, int $userId): array
    {
        DB::transaction(function () use ($values, $userId): void {
            foreach (array_intersect_key($values, self::DEFAULTS) as $key => $value) {
                PlatformSetting::query()->updateOrCreate(
                    ['key' => $key],
                    ['value' => ['value' => $value], 'is_public' => in_array($key, ['site_name', 'support_email', 'announcement'], true), 'updated_by' => $userId]
                );
            }
        });

        return $this->all();
    }
}
