<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentMemory extends Model
{
    protected $fillable = [
        'interview_session_id',
        'questions_asked',
        'answers_summary',
        'candidate_strengths',
        'candidate_weaknesses',
        'topics_covered',
        'token_budget_used',
    ];

    protected function casts(): array
    {
        return [
            'questions_asked' => 'array',
            'answers_summary' => 'array',
            'candidate_strengths' => 'array',
            'candidate_weaknesses' => 'array',
            'topics_covered' => 'array',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(InterviewSession::class, 'interview_session_id');
    }
}
