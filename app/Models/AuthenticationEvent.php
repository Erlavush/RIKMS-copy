<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $email
 * @property bool $successful
 * @property string|null $ip_address
 * @property string|null $failure_reason
 * @property Carbon $created_at
 * @property-read User|null $user
 */
class AuthenticationEvent extends Model
{
    protected $fillable = [
        'user_id', 'email', 'successful', 'ip_address', 'user_agent', 'failure_reason',
    ];

    protected function casts(): array
    {
        return ['successful' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
