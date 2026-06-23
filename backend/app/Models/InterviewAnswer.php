<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class InterviewAnswer extends Model
{
    protected $fillable = [
        'interview_question_id',
        'transcript',
        'audio_path',
        'video_path',
        'duration_seconds',
        'idempotency_key',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(InterviewQuestion::class, 'interview_question_id');
    }

    public function score(): HasOne
    {
        return $this->hasOne(InterviewScore::class);
    }
}
