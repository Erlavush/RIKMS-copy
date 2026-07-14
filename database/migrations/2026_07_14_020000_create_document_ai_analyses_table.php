<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_ai_analyses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 32)->default('queued');
            $table->string('model', 100);
            $table->string('prompt_version', 100);
            $table->string('source_hash', 64);
            $table->string('extraction_method', 64)->nullable();
            $table->json('suggestions')->nullable();
            $table->json('accepted_fields')->nullable();
            $table->decimal('confidence', 5, 4)->nullable();
            $table->unsignedInteger('input_tokens')->nullable();
            $table->unsignedInteger('output_tokens')->nullable();
            $table->unsignedInteger('reasoning_tokens')->nullable();
            $table->decimal('estimated_cost_usd', 12, 6)->nullable();
            $table->string('error_code', 100)->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['document_id', 'created_at']);
            $table->index(['status', 'created_at']);
            $table->index(['source_hash', 'model']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_ai_analyses');
    }
};
