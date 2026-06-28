<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterviewReport extends Model
{
    protected $fillable = [
        'interview_id',
        'overall_score',
        'category_scores',
        'strengths',
        'weaknesses',
        'improvement_areas',
        'hiring_recommendation',
        'pdf_path',
        'report_json',
        'behavior_summary',
    ];

    protected function casts(): array
    {
        return [
            'category_scores'  => 'array',
            'strengths'        => 'array',
            'weaknesses'       => 'array',
            'improvement_areas' => 'array',
            'report_json'      => 'array',
            'behavior_summary' => 'array',
        ];
    }

    public function interview(): BelongsTo
    {
        return $this->belongsTo(Interview::class);
    }
}
