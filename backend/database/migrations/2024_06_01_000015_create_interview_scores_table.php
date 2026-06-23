<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_answer_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('relevance');
            $table->unsignedTinyInteger('technical_accuracy');
            $table->unsignedTinyInteger('communication');
            $table->unsignedTinyInteger('confidence');
            $table->unsignedTinyInteger('completeness');
            $table->unsignedTinyInteger('overall_score');
            $table->json('strengths');
            $table->json('weaknesses');
            $table->json('recommendations');
            $table->json('raw_ai_response')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_scores');
    }
};
