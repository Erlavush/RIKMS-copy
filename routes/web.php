<?php

use App\Http\Controllers\AccessRequestController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\SpaController;
use App\Http\Controllers\SpaDocumentController;
use Illuminate\Support\Facades\Route;

Route::get('/api/rikms/bootstrap', [SpaController::class, 'bootstrap'])->name('api.rikms.bootstrap');

Route::post('/login', [AuthController::class, 'login'])->middleware('guest')->name('login.store');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

Route::post('/api/rikms/documents', [SpaDocumentController::class, 'store'])
    ->middleware('auth')
    ->name('api.rikms.documents.store');

Route::middleware('guest')->group(function () {
    Route::get('/login', SpaController::class)->name('login');
    Route::get('/admin/login', SpaController::class)->name('admin.login');
});

Route::get('/', SpaController::class)->name('home');
Route::get('/browse', SpaController::class)->name('browse');
Route::get('/research/{id}', SpaController::class)->whereNumber('id')->name('research.show');
Route::get('/agencies', SpaController::class)->name('agencies.index');
Route::get('/agencies/{id}', SpaController::class)->whereNumber('id')->name('agencies.show');
Route::get('/about', SpaController::class)->name('about');

Route::middleware('auth')->group(function () {
    Route::redirect('/dashboard', '/agency/dashboard')->name('dashboard');
    Route::redirect('/repository', '/agency/research')->name('repository');
    Route::redirect('/upload/new', '/agency/upload')->name('upload.new');
    Route::redirect('/access-requests', '/agency/access-requests')->name('access-requests.index');
    Route::redirect('/archive', '/agency/archive')->name('archive');
    Route::redirect('/analytics', '/agency/analytics')->name('analytics');
    Route::redirect('/notifications', '/agency/notifications')->name('notifications');
    Route::redirect('/agency-profile', '/agency/profile')->name('agency-profile');
    Route::redirect('/settings', '/agency/settings')->name('settings');

    Route::put('/documents/{document}', [DocumentController::class, 'update'])->name('documents.update');
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
    Route::post('/documents/{document}/request-access', [DocumentController::class, 'requestAccess'])->name('documents.request-access');
    Route::post('/access-requests/{accessRequest}/approve', [AccessRequestController::class, 'approve'])->name('access-requests.approve');
    Route::post('/access-requests/{accessRequest}/reject', [AccessRequestController::class, 'reject'])->name('access-requests.reject');

    Route::get('/agency/{any?}', SpaController::class)
        ->where('any', '.*')
        ->name('agency.spa');

    Route::get('/admin/{any?}', SpaController::class)
        ->where('any', '.*')
        ->name('admin.spa');
});
