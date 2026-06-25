<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('answer_behaviors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_answer_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('confidence')->default(0);
            $table->unsignedTinyInteger('nervousness')->default(0);
            $table->float('eye_contact_ratio')->default(0);
            $table->float('head_stability')->default(0);
            $table->float('blink_rate')->default(0);
            $table->json('emotion_distribution')->nullable();
            $table->json('prosody')->nullable();
            $table->json('raw')->nullable();
            $table->text('coaching_narrative')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('answer_behaviors');
    }
};
