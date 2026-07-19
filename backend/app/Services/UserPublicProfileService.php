<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;

class UserPublicProfileService
{
    public function ensureSlug(User $user): User
    {
        if ($user->public_slug) {
            return $user;
        }

        $base = Str::slug($user->name) ?: 'candidate';
        $slug = $base;
        $counter = 1;

        while (User::where('public_slug', $slug)->where('id', '!=', $user->id)->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        $user->update(['public_slug' => $slug]);

        return $user->fresh();
    }

    /**
     * @return array<string, mixed>
     */
    public function userStats(User $user): array
    {
        $completed = $user->interviews()
            ->where('status', 'completed')
            ->with('report:id,interview_id,overall_score,hiring_recommendation')
            ->get();

        $scores = $completed
            ->map(fn ($i) => $i->report?->overall_score)
            ->filter(fn ($s) => $s !== null && $s > 0)
            ->values();

        $avgScore = $scores->isEmpty() ? null : (int) round($scores->avg());

        return [
            'interview_count' => $user->interviews()->count(),
            'completed_count' => $completed->count(),
            'average_score' => $avgScore,
            'last_active_at' => $user->interviews()->latest()->value('updated_at'),
        ];
    }

    /**
     * @return array<int, string>
     */
    public function extractSkills(User $user): array
    {
        $resume = $user->resumes()
            ->where('status', 'parsed')
            ->latest()
            ->first();

        if (! $resume?->parsed_profile) {
            return [];
        }

        $profile = $resume->parsed_profile;
        $skills = $profile['skills'] ?? $profile['technical_skills'] ?? [];

        if (is_string($skills)) {
            return array_filter(array_map('trim', explode(',', $skills)));
        }

        if (is_array($skills)) {
            return array_values(array_filter(array_map(
                fn ($s) => is_string($s) ? trim($s) : (is_array($s) ? ($s['name'] ?? $s['skill'] ?? null) : null),
                $skills
            )));
        }

        return [];
    }

    /**
     * @return array<string, mixed>
     */
    public function publicProfilePayload(User $user): array
    {
        $stats = $this->userStats($user);

        return [
            'name' => $user->name,
            'slug' => $user->public_slug,
            'headline' => $user->public_headline,
            'average_score' => $stats['average_score'],
            'completed_count' => $stats['completed_count'],
            'skills' => $this->extractSkills($user),
        ];
    }
}
