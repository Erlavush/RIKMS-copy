<?php

use App\Http\Controllers\Api\AccessRequestApiController;
use App\Http\Controllers\Api\AdminApiController;
use App\Http\Controllers\Api\AgencyApiController;
use App\Http\Controllers\Api\CommonApiController;
use App\Http\Controllers\Api\DocumentAiAnalysisController;
use App\Http\Controllers\Api\DocumentApiController;
use App\Http\Controllers\Api\PublicApiController;
use App\Http\Controllers\Api\TwoFactorSetupController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SpaController;
use App\Http\Controllers\TwoFactorChallengeController;
use Illuminate\Support\Facades\Route;

Route::get('/api/rikms/bootstrap', [PublicApiController::class, 'bootstrap'])->middleware('throttle:public-read')->name('api.rikms.bootstrap');
Route::get('/api/rikms/public/documents', [PublicApiController::class, 'index'])->middleware('throttle:public-read')->name('api.rikms.public.documents.index');
Route::get('/api/rikms/public/documents/{document}', [PublicApiController::class, 'show'])->whereNumber('document')->middleware('throttle:public-read')->name('api.rikms.public.documents.show');
Route::post('/api/rikms/public/documents/{document}/access-requests', [PublicApiController::class, 'requestAccess'])
    ->whereNumber('document')->middleware('throttle:public-access-request')->name('api.rikms.public.documents.access-requests');
Route::get('/api/rikms/public/documents/{document}/download', [PublicApiController::class, 'download'])
    ->whereNumber('document')->middleware('throttle:public-download')->name('api.rikms.public.documents.download');

Route::get('/login', SpaController::class)->name('login');
Route::get('/admin/login', SpaController::class)->name('admin.login');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login')->name('login.store');
Route::get('/two-factor-challenge', SpaController::class)->middleware('guest')->name('two-factor.challenge');
Route::post('/two-factor-challenge', [TwoFactorChallengeController::class, 'store'])
    ->middleware(['guest', 'throttle:two-factor-challenge'])->name('two-factor.challenge.store');
Route::middleware('guest')->group(function (): void {
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:login')->name('password.email');
    Route::get('/reset-password/{token}', SpaController::class)->name('password.reset');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:login')->name('password.update');
});

Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');
Route::get('/dashboard', fn () => redirect(auth()->user()?->role === 'super_admin' ? '/admin/dashboard' : '/agency/dashboard'))
    ->middleware('auth')->name('dashboard');

Route::middleware(['auth', 'throttle:authenticated-api'])->prefix('api/rikms')->group(function (): void {
    Route::middleware('role:agency_admin,super_admin')->group(function (): void {
        Route::get('/me', [CommonApiController::class, 'me']);
        Route::post('/change-password', [CommonApiController::class, 'changePassword']);
        Route::get('/notifications', [CommonApiController::class, 'notifications']);
        Route::patch('/notifications/{notification}/read', [CommonApiController::class, 'readNotification'])->whereNumber('notification');
        Route::post('/notifications/read-all', [CommonApiController::class, 'readAll']);
    });

    Route::middleware(['role:super_admin', 'password.changed'])->prefix('two-factor')->group(function (): void {
        Route::get('/', [TwoFactorSetupController::class, 'show']);
        Route::post('/setup', [TwoFactorSetupController::class, 'start']);
        Route::post('/confirm', [TwoFactorSetupController::class, 'confirm']);
        Route::post('/recovery-codes', [TwoFactorSetupController::class, 'regenerate']);
    });

    Route::middleware(['role:agency_admin', 'password.changed'])->group(function (): void {
        Route::post('/documents', [DocumentApiController::class, 'store'])->middleware('permission:documents.create')->name('api.rikms.documents.store');

        Route::prefix('agency')->group(function (): void {
            Route::get('/dashboard', [AgencyApiController::class, 'dashboard'])->middleware('permission:documents.view');
            Route::get('/documents', [AgencyApiController::class, 'documents'])->middleware('permission:documents.view');
            Route::get('/archive', [AgencyApiController::class, 'archive'])->middleware('permission:documents.view');
            Route::get('/access-requests', [AgencyApiController::class, 'accessRequests'])->middleware('permission:access_requests.manage');
            Route::get('/analytics', [AgencyApiController::class, 'analytics'])->middleware('permission:documents.view');
            Route::get('/activity', [AgencyApiController::class, 'activity'])->middleware('permission:documents.view');
            Route::get('/profile', [AgencyApiController::class, 'profile']);
            Route::patch('/profile', [AgencyApiController::class, 'updateProfile'])->middleware('permission:agency.manage');
            Route::get('/settings', [AgencyApiController::class, 'settings']);
            Route::patch('/settings', [AgencyApiController::class, 'updateSettings'])->middleware('permission:agency.manage');

            Route::get('/documents/{document}', [DocumentApiController::class, 'show'])->whereNumber('document')->middleware('permission:documents.view');
            Route::get('/documents/{document}/ai-analysis', [DocumentAiAnalysisController::class, 'show'])
                ->whereNumber('document')->middleware('permission:documents.view');
            Route::post('/documents/{document}/ai-analysis', [DocumentAiAnalysisController::class, 'store'])
                ->whereNumber('document')->middleware(['permission:documents.update', 'throttle:ai-analysis']);
            Route::post('/documents/{document}/ai-analysis/{analysis}/accept', [DocumentAiAnalysisController::class, 'accept'])
                ->whereNumber(['document', 'analysis'])->middleware(['permission:documents.update', 'throttle:ai-analysis']);
            Route::match(['put', 'patch'], '/documents/{document}', [DocumentApiController::class, 'update'])->whereNumber('document')->middleware('permission:documents.update');
            Route::delete('/documents/{document}', [DocumentApiController::class, 'archive'])->whereNumber('document')->middleware('permission:documents.archive');
            Route::post('/documents/{document}/submit', [DocumentApiController::class, 'submit'])->whereNumber('document')->middleware('permission:documents.submit');
            Route::post('/documents/{document}/restore', [DocumentApiController::class, 'restore'])->whereNumber('document')->middleware('permission:documents.archive');
            Route::get('/documents/{document}/download', [DocumentApiController::class, 'download'])->whereNumber('document')->middleware('permission:documents.view');
            Route::get('/documents/{document}/versions', [DocumentApiController::class, 'versions'])->whereNumber('document')->middleware('permission:documents.view');
            Route::post('/documents/{document}/versions', [DocumentApiController::class, 'createVersion'])->whereNumber('document')->middleware('permission:documents.update');
            Route::post('/documents/{document}/versions/{version}/restore', [DocumentApiController::class, 'restoreVersion'])
                ->whereNumber(['document', 'version'])->middleware('permission:documents.update');
            Route::post('/access-requests/{accessRequest}/approve', [AccessRequestApiController::class, 'approve'])->whereNumber('accessRequest')->middleware('permission:access_requests.manage');
            Route::post('/access-requests/{accessRequest}/reject', [AccessRequestApiController::class, 'reject'])->whereNumber('accessRequest')->middleware('permission:access_requests.manage');
        });

        // Compatibility aliases for the version-management screen contract.
        Route::get('/documents/{document}/versions', [DocumentApiController::class, 'versions'])->whereNumber('document')->middleware('permission:documents.view');
        Route::post('/documents/{document}/versions', [DocumentApiController::class, 'createVersion'])->whereNumber('document')->middleware('permission:documents.update');
        Route::post('/documents/{document}/versions/{version}/restore', [DocumentApiController::class, 'restoreVersion'])
            ->whereNumber(['document', 'version'])->middleware('permission:documents.update');
    });

    Route::middleware(['role:super_admin', 'password.changed', 'two-factor'])->prefix('admin')->group(function (): void {
        Route::get('/dashboard', [AdminApiController::class, 'dashboard']);
        Route::get('/agencies', [AdminApiController::class, 'agencies']);
        Route::post('/agencies', [AdminApiController::class, 'storeAgency']);
        Route::patch('/agencies/{agency}', [AdminApiController::class, 'updateAgency'])->whereNumber('agency');
        Route::get('/users', [AdminApiController::class, 'users']);
        Route::post('/users', [AdminApiController::class, 'storeUser']);
        Route::patch('/users/{user}', [AdminApiController::class, 'updateUser'])->whereNumber('user');
        Route::get('/documents', [AdminApiController::class, 'documents']);
        Route::get('/moderation', [AdminApiController::class, 'moderation']);
        Route::get('/documents/{document}', [AdminApiController::class, 'showDocument'])->whereNumber('document');
        Route::get('/documents/{document}/download', [DocumentApiController::class, 'download'])->whereNumber('document');
        Route::post('/documents/{document}/approve', [DocumentApiController::class, 'approve'])->whereNumber('document');
        Route::post('/documents/{document}/reject', [DocumentApiController::class, 'reject'])->whereNumber('document');
        Route::post('/documents/{document}/archive', [DocumentApiController::class, 'archive'])->whereNumber('document');
        Route::post('/documents/{document}/restore', [DocumentApiController::class, 'restore'])->whereNumber('document');
        Route::get('/access-requests', [AdminApiController::class, 'accessRequests']);
        Route::post('/access-requests/{accessRequest}/approve', [AccessRequestApiController::class, 'approve'])->whereNumber('accessRequest');
        Route::post('/access-requests/{accessRequest}/reject', [AccessRequestApiController::class, 'reject'])->whereNumber('accessRequest');
        Route::get('/analytics', [AdminApiController::class, 'analytics']);
        Route::get('/audit-logs', [AdminApiController::class, 'auditLogs']);
        Route::get('/roles', [AdminApiController::class, 'roles']);
        Route::patch('/roles/{role}', [AdminApiController::class, 'updateRole']);
        Route::get('/archive', [AdminApiController::class, 'archive']);
        Route::get('/settings', [AdminApiController::class, 'settings']);
        Route::patch('/settings', [AdminApiController::class, 'updateSettings']);
        Route::get('/security', [AdminApiController::class, 'security']);
    });
});

Route::get('/', SpaController::class)->name('home');
Route::get('/browse', SpaController::class)->name('browse');
Route::get('/research/{id}', SpaController::class)->whereNumber('id')->name('research.show');
Route::get('/agencies', SpaController::class)->name('agencies.index');
Route::get('/agencies/{id}', SpaController::class)->whereNumber('id')->name('agencies.show');
Route::get('/about', SpaController::class)->name('about');
Route::get('/help', SpaController::class)->name('help');
Route::get('/contact', SpaController::class)->name('contact');
Route::get('/privacy', SpaController::class)->name('privacy');
Route::get('/terms', SpaController::class)->name('terms');
Route::get('/change-password', SpaController::class)->middleware(['auth', 'role:agency_admin,super_admin'])->name('password.change');
Route::get('/two-factor/setup', SpaController::class)
    ->middleware(['auth', 'role:super_admin', 'password.changed'])->name('two-factor.setup');

Route::middleware(['auth', 'role:agency_admin', 'password.changed'])->group(function (): void {
    Route::redirect('/repository', '/agency/research')->name('repository');
    Route::redirect('/upload/new', '/agency/upload')->name('upload.new');
    Route::get('/agency/{any?}', SpaController::class)->where('any', '.*')->name('agency.spa');
});

Route::middleware(['auth', 'role:super_admin', 'password.changed', 'two-factor'])->group(function (): void {
    Route::get('/admin/{any?}', SpaController::class)->where('any', '.*')->name('admin.spa');
});

Route::middleware('auth')->group(function (): void {
    Route::post('/api/rikms/documents/{document}/analyze', [\App\Http\Controllers\SpaDocumentController::class, 'runAiAnalysis'])->name('api.rikms.documents.analyze');
    Route::post('/api/rikms/documents/upload-draft', [\App\Http\Controllers\SpaDocumentController::class, 'uploadDraft'])->name('api.rikms.documents.upload-draft');
    Route::post('/api/rikms/documents/{document}/approve', [\App\Http\Controllers\SpaDocumentController::class, 'approve'])->name('api.rikms.documents.approve');
    Route::post('/api/rikms/documents/{document}/reject', [\App\Http\Controllers\SpaDocumentController::class, 'reject'])->name('api.rikms.documents.reject');
    Route::post('/api/rikms/documents/{document}/re-run-ai', [\App\Http\Controllers\SpaDocumentController::class, 'reRunAi'])->name('api.rikms.documents.re-run-ai');
});
