<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('hash')->nullable()->after('mime_type');
            $table->string('malware_status')->default('pending')->after('hash');
            $table->string('integrity_status')->default('pending')->after('malware_status');
            $table->string('processing_status')->default('pending')->after('integrity_status');
            $table->longText('extracted_text')->nullable()->after('processing_status');
            $table->text('processing_error')->nullable()->after('extracted_text');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn([
                'hash',
                'malware_status',
                'integrity_status',
                'processing_status',
                'extracted_text',
                'processing_error',
            ]);
        });
    }
};
