<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Interview extends Model
{
    protected $fillable = [
        'user_id',
        'resume_id',
        'job_title',
        'job_description',
        'job_analysis',
        'experience_level',
        'interview_type',
        'status',
        'scheduled_at',
        'alarm_message',
        'alarm_triggered_at',
        'reminder_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'job_analysis'       => 'array',
            'scheduled_at'       => 'datetime',
            'alarm_triggered_at' => 'datetime',
            'reminder_sent_at'   => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function resume(): BelongsTo
    {
        return $this->belongsTo(Resume::class);
    }

    public function session(): HasOne
    {
        return $this->hasOne(InterviewSession::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(InterviewQuestion::class);
    }

    public function report(): HasOne
    {
        return $this->hasOne(InterviewReport::class);
    }
}
