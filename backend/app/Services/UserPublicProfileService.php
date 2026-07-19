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
     * @return array<string, mixed>|null
     */
    public function latestParsedResume(User $user): ?\App\Models\Resume
    {
        return $user->resumes()
            ->where('status', 'parsed')
            ->whereNotNull('parsed_profile')
            ->latest()
            ->first();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function publicCvPayload(?\App\Models\Resume $resume): ?array
    {
        if (! $resume?->parsed_profile) {
            return null;
        }

        $profile = $resume->parsed_profile;

        $projects = $profile['projects'] ?? [];
        if (is_array($projects)) {
            $projects = array_values(array_filter(array_map(
                fn ($p) => is_string($p) ? trim($p) : (is_array($p) ? ($p['name'] ?? $p['title'] ?? null) : null),
                $projects
            )));
        } else {
            $projects = [];
        }

        $education = $profile['education'] ?? [];
        if (! is_array($education)) {
            $education = is_string($education) ? [$education] : [];
        }

        return [
            'filename' => $resume->original_filename,
            'updated_at' => $resume->updated_at,
            'summary' => is_string($profile['summary'] ?? null) ? $profile['summary'] : null,
            'experience_years' => (int) ($profile['experience_years'] ?? $profile['years_experience'] ?? 0),
            'skills' => $this->normalizeSkillList($profile['skills'] ?? $profile['technical_skills'] ?? []),
            'education' => array_values(array_filter(array_map(
                fn ($e) => is_string($e) ? trim($e) : null,
                $education
            ))),
            'projects' => array_slice($projects, 0, 8),
        ];
    }

    /**
     * @param  mixed  $skills
     * @return array<int, string>
     */
    private function normalizeSkillList(mixed $skills): array
    {
        if (is_string($skills)) {
            return array_values(array_filter(array_map('trim', explode(',', $skills))));
        }

        if (! is_array($skills)) {
            return [];
        }

        return array_values(array_filter(array_map(
            fn ($s) => is_string($s) ? trim($s) : (is_array($s) ? ($s['name'] ?? $s['skill'] ?? null) : null),
            $skills
        )));
    }

    /**
     * @return array<int, string>
     */
    public function extractSkills(User $user): array
    {
        $resume = $this->latestParsedResume($user);

        if (! $resume?->parsed_profile) {
            return [];
        }

        $profile = $resume->parsed_profile;

        return $this->normalizeSkillList($profile['skills'] ?? $profile['technical_skills'] ?? []);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function publicInterviewsPayload(User $user): array
    {
        return $user->interviews()
            ->where('status', 'completed')
            ->with(['report:id,interview_id,overall_score,hiring_recommendation,category_scores,strengths,weaknesses'])
            ->latest()
            ->get(['id', 'job_title', 'interview_type', 'experience_level', 'created_at'])
            ->map(fn ($interview) => [
                'id' => $interview->id,
                'job_title' => $interview->job_title,
                'interview_type' => $interview->interview_type,
                'experience_level' => $interview->experience_level,
                'created_at' => $interview->created_at,
                'overall_score' => $interview->report?->overall_score,
                'hiring_recommendation' => $interview->report?->hiring_recommendation,
                'category_scores' => $interview->report?->category_scores ?? [],
                'strengths' => array_slice((array) ($interview->report?->strengths ?? []), 0, 4),
                'weaknesses' => array_slice((array) ($interview->report?->weaknesses ?? []), 0, 3),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function publicPerformancePayload(User $user): array
    {
        $interviews = $user->interviews()
            ->where('status', 'completed')
            ->with('report:id,interview_id,overall_score,hiring_recommendation,strengths,weaknesses,improvement_areas')
            ->get();

        $scores = $interviews
            ->map(fn ($i) => $i->report?->overall_score)
            ->filter(fn ($s) => $s !== null && $s > 0)
            ->values();

        $bestScore = $scores->isEmpty() ? null : (int) $scores->max();

        $byType = ['technical', 'behavioral', 'mixed'];
        $typeBreakdown = [];
        foreach ($byType as $type) {
            $rows = $interviews->where('interview_type', $type)
                ->map(fn ($i) => $i->report?->overall_score)
                ->filter(fn ($s) => $s !== null && $s > 0);
            $typeBreakdown[$type] = [
                'count' => $rows->count(),
                'average_score' => $rows->isEmpty() ? null : (int) round($rows->avg()),
            ];
        }

        $allStrengths = [];
        $allWeaknesses = [];
        $allImprovements = [];
        foreach ($interviews as $interview) {
            foreach ((array) ($interview->report?->strengths ?? []) as $s) {
                if (is_string($s) && trim($s) !== '') {
                    $allStrengths[] = trim($s);
                }
            }
            foreach ((array) ($interview->report?->weaknesses ?? []) as $w) {
                if (is_string($w) && trim($w) !== '') {
                    $allWeaknesses[] = trim($w);
                }
            }
            foreach ((array) ($interview->report?->improvement_areas ?? []) as $a) {
                if (is_string($a) && trim($a) !== '') {
                    $allImprovements[] = trim($a);
                }
            }
        }

        return [
            'best_score' => $bestScore,
            'by_type' => $typeBreakdown,
            'top_strengths' => array_values(array_unique(array_slice($allStrengths, 0, 6))),
            'improvement_areas' => array_values(array_unique(array_slice($allImprovements ?: $allWeaknesses, 0, 5))),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function publicProfilePayload(User $user): array
    {
        $stats = $this->userStats($user);
        $resume = $this->latestParsedResume($user);
        $cv = $this->publicCvPayload($resume);
        $skills = $cv['skills'] ?? $this->extractSkills($user);

        return [
            'name' => $user->name,
            'slug' => $user->public_slug,
            'headline' => $user->public_headline,
            'member_since' => $user->created_at,
            'average_score' => $stats['average_score'],
            'completed_count' => $stats['completed_count'],
            'interview_count' => $stats['interview_count'],
            'last_active_at' => $stats['last_active_at'],
            'skills' => $skills,
            'cv' => $cv,
            'interviews' => $this->publicInterviewsPayload($user),
            'performance' => $this->publicPerformancePayload($user),
        ];
    }
}
