<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agencies', function (Blueprint $table) {
            $table->string('abbreviation', 32)->nullable()->after('name');
            $table->string('type')->default('Government Agency')->after('region');
            $table->text('description')->nullable()->after('type');
            $table->string('phone', 64)->nullable()->after('contact_email');
            $table->string('website')->nullable()->after('phone');
            $table->text('address')->nullable()->after('website');
            $table->boolean('is_active')->default(true)->index()->after('address');
            $table->json('settings')->nullable()->after('is_active');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->index()->after('avatar');
            $table->boolean('must_change_password')->default(false)->after('is_active');
            $table->timestamp('last_login_at')->nullable()->after('must_change_password');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->string('reporting_quarter', 32)->nullable()->after('year');
            $table->unsignedBigInteger('download_count')->default(0)->after('digital_library_score');
            $table->foreignId('reviewed_by')->nullable()->after('submitted_at')->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            $table->text('rejection_reason')->nullable()->after('reviewed_at');
            $table->string('pre_archive_status')->nullable()->after('rejection_reason');
            $table->timestamp('archived_at')->nullable()->after('pre_archive_status');
            $table->index(['agency_id', 'status']);
            $table->index(['status', 'published_at']);
            $table->index(['year', 'category']);
        });

        Schema::table('access_requests', function (Blueprint $table) {
            $table->string('requester_organization')->nullable()->after('requester_email');
            $table->text('decision_reason')->nullable()->after('status');
            $table->foreignId('decided_by')->nullable()->after('approved_by')->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable()->after('rejected_at');
            $table->index(['document_id', 'status']);
            $table->index(['requester_email', 'status']);
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->foreignId('agency_id')->nullable()->after('document_id')->constrained()->nullOnDelete();
            $table->string('event_type')->default('activity')->after('action');
            $table->string('severity', 16)->default('info')->after('event_type');
            $table->index(['agency_id', 'created_at']);
            $table->index(['event_type', 'created_at']);
        });

        Schema::create('document_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->json('snapshot');
            $table->string('file_path')->nullable();
            $table->string('original_filename')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->text('change_summary')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('restored_at')->nullable();
            $table->timestamps();
            $table->unique(['document_id', 'version_number']);
        });

        Schema::create('download_grants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('access_request_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email')->nullable();
            $table->string('token_hash', 64)->unique();
            $table->timestamp('expires_at');
            $table->unsignedInteger('max_downloads')->default(5);
            $table->unsignedInteger('download_count')->default(0);
            $table->timestamp('revoked_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['document_id', 'expires_at']);
        });

        Schema::create('download_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('download_grant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            $table->index(['document_id', 'created_at']);
        });

        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'read_at', 'created_at']);
        });

        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->boolean('is_public')->default(false);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('authentication_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email');
            $table->boolean('successful');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('failure_reason')->nullable();
            $table->timestamps();
            $table->index(['successful', 'created_at']);
            $table->index(['email', 'created_at']);
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('label');
            $table->boolean('is_system')->default(true);
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('label');
            $table->timestamps();
        });

        Schema::create('permission_role', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->primary(['role_id', 'permission_id']);
        });

        $now = now();
        DB::table('roles')->insert([
            ['name' => 'agency_admin', 'label' => 'Agency Administrator', 'is_system' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'super_admin', 'label' => 'Super Administrator', 'is_system' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
        $permissions = [
            'documents.view' => 'View agency documents',
            'documents.create' => 'Create documents',
            'documents.update' => 'Update documents',
            'documents.submit' => 'Submit documents',
            'documents.archive' => 'Archive and restore documents',
            'access_requests.manage' => 'Manage document access requests',
            'agency.manage' => 'Manage agency profile and settings',
            'platform.admin' => 'Administer the RIKMS platform',
        ];
        foreach ($permissions as $name => $label) {
            DB::table('permissions')->insert(compact('name', 'label') + ['created_at' => $now, 'updated_at' => $now]);
        }
        $roleIds = DB::table('roles')->pluck('id', 'name');
        $permissionIds = DB::table('permissions')->pluck('id', 'name');
        foreach ($permissionIds as $name => $permissionId) {
            if ($name !== 'platform.admin') {
                DB::table('permission_role')->insert(['role_id' => $roleIds['agency_admin'], 'permission_id' => $permissionId]);
            }
            DB::table('permission_role')->insert(['role_id' => $roleIds['super_admin'], 'permission_id' => $permissionId]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('authentication_events');
        Schema::dropIfExists('platform_settings');
        Schema::dropIfExists('user_notifications');
        Schema::dropIfExists('download_events');
        Schema::dropIfExists('download_grants');
        Schema::dropIfExists('document_versions');

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['agency_id', 'created_at']);
            $table->dropIndex(['event_type', 'created_at']);
            $table->dropForeign(['agency_id']);
            $table->dropColumn(['agency_id', 'event_type', 'severity']);
        });

        Schema::table('access_requests', function (Blueprint $table) {
            $table->dropIndex(['document_id', 'status']);
            $table->dropIndex(['requester_email', 'status']);
            $table->dropForeign(['decided_by']);
            $table->dropColumn(['requester_organization', 'decision_reason', 'decided_by', 'decided_at']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex(['agency_id', 'status']);
            $table->dropIndex(['status', 'published_at']);
            $table->dropIndex(['year', 'category']);
            $table->dropForeign(['reviewed_by']);
            $table->dropColumn([
                'reporting_quarter', 'download_count', 'reviewed_by', 'reviewed_at',
                'rejection_reason', 'pre_archive_status', 'archived_at',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
            $table->dropColumn(['is_active', 'must_change_password', 'last_login_at', 'last_login_ip']);
        });

        Schema::table('agencies', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
            $table->dropColumn([
                'abbreviation', 'type', 'description', 'phone', 'website', 'address',
                'is_active', 'settings',
            ]);
        });
    }
};
