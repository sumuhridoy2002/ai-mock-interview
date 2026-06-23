<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterviewScore extends Model
{
    protected $fillable = [
        'interview_answer_id',
        'relevance',
        'technical_accuracy',
        'communication',
        'confidence',
        'completeness',
        'overall_score',
        'strengths',
        'weaknesses',
        'recommendations',
        'raw_ai_response',
    ];

    protected function casts(): array
    {
        return [
            'strengths' => 'array',
            'weaknesses' => 'array',
            'recommendations' => 'array',
            'raw_ai_response' => 'array',
        ];
    }

    public function answer(): BelongsTo
    {
        return $this->belongsTo(InterviewAnswer::class, 'interview_answer_id');
    }
}
