<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_memories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_session_id')->constrained()->cascadeOnDelete();
            $table->json('questions_asked')->nullable();
            $table->json('answers_summary')->nullable();
            $table->json('candidate_strengths')->nullable();
            $table->json('candidate_weaknesses')->nullable();
            $table->json('topics_covered')->nullable();
            $table->unsignedInteger('token_budget_used')->default(0);
            $table->timestamps();

            $table->index('interview_session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_memories');
    }
};
