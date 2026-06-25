<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnswerBehavior extends Model
{
    protected $fillable = [
        'interview_answer_id',
        'confidence',
        'nervousness',
        'eye_contact_ratio',
        'head_stability',
        'blink_rate',
        'emotion_distribution',
        'prosody',
        'raw',
        'coaching_narrative',
    ];

    protected function casts(): array
    {
        return [
            'emotion_distribution' => 'array',
            'prosody' => 'array',
            'raw' => 'array',
            'confidence' => 'integer',
            'nervousness' => 'integer',
            'eye_contact_ratio' => 'float',
            'head_stability' => 'float',
            'blink_rate' => 'float',
        ];
    }

    public function answer(): BelongsTo
    {
        return $this->belongsTo(InterviewAnswer::class, 'interview_answer_id');
    }
}
