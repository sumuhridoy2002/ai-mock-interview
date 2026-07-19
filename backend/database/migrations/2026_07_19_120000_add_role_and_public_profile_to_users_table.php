<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'candidate'])->default('candidate')->after('email');
            $table->string('public_slug')->nullable()->unique()->after('role');
            $table->boolean('is_profile_public')->default(false)->after('public_slug');
            $table->boolean('show_on_leaderboard')->default(false)->after('is_profile_public');
            $table->string('public_headline')->nullable()->after('show_on_leaderboard');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role',
                'public_slug',
                'is_profile_public',
                'show_on_leaderboard',
                'public_headline',
            ]);
        });
    }
};
