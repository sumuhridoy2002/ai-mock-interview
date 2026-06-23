<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('resume_id')->constrained()->cascadeOnDelete();
            $table->string('job_title');
            $table->text('job_description');
            $table->json('job_analysis')->nullable();
            $table->enum('experience_level', ['junior', 'mid', 'senior']);
            $table->enum('interview_type', ['technical', 'behavioral', 'mixed']);
            $table->enum('status', ['draft', 'setup', 'active', 'completed', 'cancelled'])->default('draft');
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('resume_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};
