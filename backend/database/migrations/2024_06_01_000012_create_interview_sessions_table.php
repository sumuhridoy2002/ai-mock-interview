<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_id')->unique()->constrained()->cascadeOnDelete();
            $table->uuid('session_uuid')->unique();
            $table->enum('phase', ['intro', 'questioning', 'wrap_up', 'completed'])->default('intro');
            $table->unsignedInteger('current_question_index')->default(0);
            $table->json('context_snapshot')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index('session_uuid');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_sessions');
    }
};
