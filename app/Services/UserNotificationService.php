<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Collection;

class UserNotificationService
{
    public function send(User $user, string $type, string $title, string $message, array $data = []): UserNotification
    {
        return UserNotification::create(compact('type', 'title', 'message', 'data') + ['user_id' => $user->id]);
    }

    public function sendToSuperAdmins(string $type, string $title, string $message, array $data = []): Collection
    {
        return User::query()->where('role', 'super_admin')->where('is_active', true)->get()
            ->map(fn (User $user) => $this->send($user, $type, $title, $message, $data));
    }

    public function sendToAgency(int $agencyId, string $type, string $title, string $message, array $data = []): Collection
    {
        return User::query()->where('agency_id', $agencyId)->where('is_active', true)->get()
            ->map(fn (User $user) => $this->send($user, $type, $title, $message, $data));
    }
}
