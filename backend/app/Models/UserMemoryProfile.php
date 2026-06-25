<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserMemoryProfile extends Model
{
    protected $fillable = [
        'user_id',
        'mastered_topics',
        'strengths',
        'weaknesses',
        'summary',
        'interviews_completed',
    ];

    protected function casts(): array
    {
        return [
            'mastered_topics' => 'array',
            'strengths' => 'array',
            'weaknesses' => 'array',
            'interviews_completed' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
