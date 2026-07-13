<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $key
 * @property array{value:mixed}|null $value
 * @property bool $is_public
 */
class PlatformSetting extends Model
{
    protected $fillable = ['key', 'value', 'is_public', 'updated_by'];

    protected function casts(): array
    {
        return ['value' => 'array', 'is_public' => 'boolean'];
    }
}
