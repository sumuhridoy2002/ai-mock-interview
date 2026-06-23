<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InterviewSession extends Model
{
    protected $fillable = [
        'interview_id',
        'session_uuid',
        'phase',
        'current_question_index',
        'context_snapshot',
        'started_at',
        'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'context_snapshot' => 'array',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function interview(): BelongsTo
    {
        return $this->belongsTo(Interview::class);
    }

    public function memories(): HasMany
    {
        return $this->hasMany(AgentMemory::class);
    }

    public function latestMemory(): ?AgentMemory
    {
        return $this->memories()->latest()->first();
    }
}
