<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserQuestionMastery extends Model
{
    protected $table = 'user_question_mastery';

    protected $fillable = [
        'user_id',
        'normalized_question',
        'topic',
        'category',
        'best_overall_score',
        'mastered',
        'source_interview_id',
    ];

    protected function casts(): array
    {
        return [
            'mastered' => 'boolean',
            'best_overall_score' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sourceInterview(): BelongsTo
    {
        return $this->belongsTo(Interview::class, 'source_interview_id');
    }
}
