<?php

use App\Models\AccessRequest;
use App\Models\Agency;
use App\Models\Document;
use App\Models\DownloadEvent;
use App\Notifications\WeeklyAgencyDigestMailNotification;
use App\Services\UserNotificationService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('rikms:weekly-digests', function (UserNotificationService $notifications): void {
    Agency::query()->where('is_active', true)->where('settings->weekly_digest', true)
        ->with(['users' => fn ($query) => $query->where('is_active', true)])
        ->each(function (Agency $agency) use ($notifications): void {
            $since = now()->subWeek();
            $statistics = [
                'documents' => Document::query()->where('agency_id', $agency->id)->where('submitted_at', '>=', $since)->count(),
                'downloads' => DownloadEvent::query()->whereHas('document', fn ($query) => $query->where('agency_id', $agency->id))->where('created_at', '>=', $since)->count(),
                'accessRequests' => AccessRequest::query()->whereHas('document', fn ($query) => $query->where('agency_id', $agency->id))->where('created_at', '>=', $since)->count(),
            ];
            foreach ($agency->users as $user) {
                $notifications->send($user, 'weekly_digest', 'Your weekly RIKMS digest',
                    "{$statistics['documents']} submissions, {$statistics['downloads']} downloads, {$statistics['accessRequests']} access requests this week.",
                    ['statistics' => $statistics]);
                $user->notify(new WeeklyAgencyDigestMailNotification($agency, $statistics));
            }
        });
})->purpose('Send weekly RIKMS agency activity digests');

Schedule::command('rikms:weekly-digests')->weeklyOn(1, '08:00')->timezone('Asia/Manila')->withoutOverlapping();
