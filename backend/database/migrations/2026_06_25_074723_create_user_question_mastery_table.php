<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_question_mastery', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('normalized_question');
            $table->string('topic')->nullable();
            $table->string('category')->default('technical');
            $table->unsignedTinyInteger('best_overall_score')->default(0);
            $table->boolean('mastered')->default(false);
            $table->foreignId('source_interview_id')->nullable()->constrained('interviews')->nullOnDelete();
            $table->timestamps();

            // Per-user we store the best score per unique question text
            $table->index('user_id');
            $table->index(['user_id', 'mastered']);
            $table->index(['user_id', 'topic']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_question_mastery');
    }
};
