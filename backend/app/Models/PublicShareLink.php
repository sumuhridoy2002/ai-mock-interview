<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublicShareLink extends Model
{
    protected $fillable = [
        'user_id',
        'token',
        'label',
        'includes_cv',
        'includes_reports',
        'includes_scores',
        'expires_at',
        'revoked_at',
        'created_by',
        'view_count',
    ];

    protected function casts(): array
    {
        return [
            'includes_cv' => 'boolean',
            'includes_reports' => 'boolean',
            'includes_scores' => 'boolean',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isActive(): bool
    {
        if ($this->revoked_at !== null) {
            return false;
        }

        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }
}
