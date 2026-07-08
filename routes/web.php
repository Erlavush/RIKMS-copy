<?php

use App\Http\Controllers\AccessRequestController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\RepositoryController;
use App\Http\Controllers\UploadWizardController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.store');
    Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download')
});

Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/', fn () => redirect()->route('dashboard'));

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/repository', [RepositoryController::class, 'index'])->name('repository');

    Route::get('/upload/new', [UploadWizardController::class, 'create'])->name('upload.new');
    Route::post('/upload/select-type', [UploadWizardController::class, 'selectType'])->name('upload.select-type');
    Route::get('/upload/{document}/step/{step}', [UploadWizardController::class, 'show'])->name('upload.step');
    Route::post('/upload/{document}/file', [UploadWizardController::class, 'storeFile'])->middleware('throttle:10,1')->name('upload.file');
    Route::post('/upload/{document}/run-ai-analysis', [UploadWizardController::class, 'runAiAnalysis'])->middleware('throttle:6,1')->name('upload.run-ai');
    Route::put('/upload/{document}/metadata', [UploadWizardController::class, 'updateMetadata'])->name('upload.metadata');
    Route::put('/upload/{document}/public-fields', [UploadWizardController::class, 'updatePublicFields'])->name('upload.public-fields');
    Route::put('/upload/{document}/sdg-tags', [UploadWizardController::class, 'updateSdgTags'])->name('upload.sdg-tags');
    Route::put('/upload/{document}/access-control', [UploadWizardController::class, 'updateAccessControl'])->name('upload.access-control');
    Route::put('/upload/{document}/performance', [UploadWizardController::class, 'updatePerformance'])->name('upload.performance');
    Route::put('/upload/{document}/pap', [UploadWizardController::class, 'updatePap'])->name('upload.pap');
    Route::put('/upload/{document}/financials', [UploadWizardController::class, 'updateFinancials'])->name('upload.financials');
    Route::put('/upload/{document}/highlights', [UploadWizardController::class, 'updateHighlights'])->name('upload.highlights');
    Route::post('/upload/{document}/submit', [UploadWizardController::class, 'submit'])->name('upload.submit');
    Route::get('/upload/{document}/success', [UploadWizardController::class, 'success'])->name('upload.success');

    Route::get('/documents/{document}', [DocumentController::class, 'show'])->name('documents.show');
    Route::put('/documents/{document}', [DocumentController::class, 'update'])->name('documents.update');
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
    Route::post('/documents/{document}/request-access', [DocumentController::class, 'requestAccess'])->name('documents.request-access');

    Route::get('/access-requests', [AccessRequestController::class, 'index'])->name('access-requests.index');
    Route::post('/access-requests/{accessRequest}/approve', [AccessRequestController::class, 'approve'])->name('access-requests.approve');
    Route::post('/access-requests/{accessRequest}/reject', [AccessRequestController::class, 'reject'])->name('access-requests.reject');

    Route::get('/archive', [PageController::class, 'placeholder'])->defaults('page', 'archive')->name('archive');
    Route::get('/analytics', [PageController::class, 'placeholder'])->defaults('page', 'analytics')->name('analytics');
    Route::get('/notifications', [PageController::class, 'placeholder'])->defaults('page', 'notifications')->name('notifications');
    Route::get('/agency-profile', [PageController::class, 'placeholder'])->defaults('page', 'agency-profile')->name('agency-profile');
    Route::get('/settings', [PageController::class, 'placeholder'])->defaults('page', 'settings')->name('settings');
});
