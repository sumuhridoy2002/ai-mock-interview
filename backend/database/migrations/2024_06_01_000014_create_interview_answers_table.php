<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_question_id')->constrained()->cascadeOnDelete();
            $table->text('transcript')->nullable();
            $table->string('audio_path')->nullable();
            $table->string('video_path')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->string('idempotency_key')->unique();
            $table->timestamps();

            $table->index('interview_question_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_answers');
    }
};
