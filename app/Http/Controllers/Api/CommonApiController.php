<?php

namespace App\Http\Controllers\Api;

use App\Models\UserNotification;
use App\Services\AuditLogService;
use App\Services\RikmsPresenter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CommonApiController extends RikmsApiController
{
    public function __construct(
        private readonly RikmsPresenter $presenter,
        private readonly AuditLogService $audit,
    ) {}

    public function me(Request $request)
    {
        $user = $request->user()->load('agency');

        return response()->json(['data' => [
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
            'role' => $user->role, 'avatar' => $user->avatar,
            'agencyId' => $user->agency_id, 'agencyName' => $user->agency?->name,
            'agencyAbbr' => $user->agency?->abbreviation(),
            'permissions' => $user->roleRecord?->permissions()->pluck('name')->values() ?? [],
            'unreadNotifications' => $user->notifications()->whereNull('read_at')->count(),
            'mustChangePassword' => $user->must_change_password,
        ]]);
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'currentPassword' => ['required', 'string'],
            'password' => ['required', 'string', 'min:12'],
            'passwordConfirmation' => ['required', 'same:password'],
        ]);
        $user = $request->user();
        if (! Hash::check($validated['currentPassword'], $user->getAuthPassword())) {
            throw ValidationException::withMessages(['currentPassword' => 'The current password is incorrect.']);
        }
        if (Hash::check($validated['password'], $user->getAuthPassword())) {
            throw ValidationException::withMessages(['password' => 'Choose a password different from your current password.']);
        }
        DB::transaction(function () use ($request, $user, $validated): void {
            $user->forceFill([
                'password' => $validated['password'], 'must_change_password' => false,
                'remember_token' => Str::random(60),
            ])->save();
            DB::table('sessions')->where('user_id', $user->id)->where('id', '!=', $request->session()->getId())->delete();
        });
        $this->audit->log('password changed', null, ['_event_type' => 'security'], $request);

        return response()->json(['message' => 'Password changed successfully.', 'redirect' => $user->isSuperAdmin() ? '/admin/dashboard' : '/agency/dashboard']);
    }

    public function notifications(Request $request)
    {
        $query = $request->user()->notifications()->latest();
        if ($request->boolean('unread')) {
            $query->whereNull('read_at');
        }
        $paginator = $query->paginate($this->perPage());

        return $this->paginated($paginator, fn (UserNotification $item) => $this->presenter->notification($item));
    }

    public function readNotification(Request $request, UserNotification $notification)
    {
        abort_unless((int) $notification->user_id === (int) $request->user()->id, 404);
        $notification->update(['read_at' => $notification->read_at ?? now()]);

        return response()->json(['message' => 'Notification marked as read.', 'data' => $this->presenter->notification($notification)]);
    }

    public function readAll(Request $request)
    {
        $request->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
