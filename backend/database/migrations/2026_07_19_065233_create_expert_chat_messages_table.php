<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expert_chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('session_id');
            $table->enum('role', ['user', 'assistant']);
            $table->text('content');
            $table->timestamps();

            $table->index(['user_id', 'session_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expert_chat_messages');
    }
};
