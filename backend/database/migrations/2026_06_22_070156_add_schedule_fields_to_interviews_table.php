<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            $table->timestamp('scheduled_at')->nullable()->after('status');
            $table->string('alarm_message', 500)->nullable()->after('scheduled_at');
            $table->timestamp('alarm_triggered_at')->nullable()->after('alarm_message');
        });
    }

    public function down(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            $table->dropColumn(['scheduled_at', 'alarm_message', 'alarm_triggered_at']);
        });
    }
};
