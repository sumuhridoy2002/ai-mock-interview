<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resumes', function (Blueprint $table) {
            $table->dropUnique(['file_hash']);
            $table->unique(['user_id', 'file_hash']);
        });
    }

    public function down(): void
    {
        Schema::table('resumes', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'file_hash']);
            $table->unique('file_hash');
        });
    }
};
