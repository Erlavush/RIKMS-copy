<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('security_scans', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 32);
            $table->string('scan_mode', 24)->default('passive');
            $table->string('target_environment', 32)->default('local');
            $table->string('target_url', 2048);
            $table->string('revision', 64)->nullable();
            $table->string('status', 24)->default('completed');
            $table->string('report_sha256', 64)->unique();
            $table->string('report_disk', 64)->nullable();
            $table->string('report_path', 2048)->nullable();
            $table->json('summary')->nullable();
            $table->text('failure_reason')->nullable();
            $table->foreignId('imported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['target_environment', 'completed_at']);
            $table->index(['status', 'completed_at']);
        });

        Schema::create('security_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('security_scan_id')->constrained()->cascadeOnDelete();
            $table->string('fingerprint', 64);
            $table->string('external_id', 128)->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('severity', 16)->default('info');
            $table->string('confidence', 24)->nullable();
            $table->string('status', 24)->default('observation');
            $table->string('owasp_category', 64)->nullable();
            $table->string('cwe', 32)->nullable();
            $table->string('http_method', 16)->nullable();
            $table->string('endpoint', 2048)->nullable();
            $table->text('evidence_summary')->nullable();
            $table->text('remediation')->nullable();
            $table->timestamp('first_seen_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('retested_at')->nullable();
            $table->timestamps();
            $table->unique(['security_scan_id', 'fingerprint']);
            $table->index(['severity', 'status']);
            $table->index(['fingerprint', 'last_seen_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_findings');
        Schema::dropIfExists('security_scans');
    }
};
