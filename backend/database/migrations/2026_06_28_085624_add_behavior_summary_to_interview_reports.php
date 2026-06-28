<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('interview_reports', function (Blueprint $table) {
            $table->json('behavior_summary')->nullable()->after('report_json');
        });
    }

    public function down(): void
    {
        Schema::table('interview_reports', function (Blueprint $table) {
            $table->dropColumn('behavior_summary');
        });
    }
};
