<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('overall_score');
            $table->json('category_scores');
            $table->json('strengths');
            $table->json('weaknesses');
            $table->json('improvement_areas');
            $table->enum('hiring_recommendation', ['strong_yes', 'yes', 'maybe', 'no', 'strong_no']);
            $table->string('pdf_path')->nullable();
            $table->json('report_json');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_reports');
    }
};
