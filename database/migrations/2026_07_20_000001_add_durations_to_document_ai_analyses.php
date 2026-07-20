<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_ai_analyses', function (Blueprint $table): void {
            $table->unsignedInteger('ocr_duration')->nullable()->after('needs_ocr');
            $table->unsignedInteger('model_duration')->nullable()->after('ocr_duration');
        });
    }

    public function down(): void
    {
        Schema::table('document_ai_analyses', function (Blueprint $table): void {
            $table->dropColumn(['ocr_duration', 'model_duration']);
        });
    }
};
