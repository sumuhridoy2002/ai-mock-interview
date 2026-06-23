<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sequence');
            $table->enum('category', ['technical', 'behavioral', 'problem_solving', 'scenario', 'communication']);
            $table->text('question_text');
            $table->json('metadata')->nullable();
            $table->enum('source', ['generated', 'follow_up'])->default('generated');
            $table->foreignId('parent_question_id')->nullable()->constrained('interview_questions')->nullOnDelete();
            $table->timestamps();

            $table->index(['interview_id', 'sequence']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_questions');
    }
};
