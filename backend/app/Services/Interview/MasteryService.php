<?php

namespace App\Services\Interview;

use App\Models\Interview;
use App\Models\InterviewAnswer;
use App\Models\InterviewScore;
use App\Models\User;
use App\Models\UserMemoryProfile;
use App\Models\UserQuestionMastery;

/**
 * Persists per-user question mastery and memory profile after every scored answer.
 */
class MasteryService
{
    public function masteryThreshold(): int
    {
        return (int) config('interview.mastery_threshold', 60);
    }

    /**
     * Call after an answer is scored. Upserts the mastery row and refreshes the
     * user memory profile for use in future interviews.
     */
    public function recordAnswer(
        User $user,
        Interview $interview,
        InterviewAnswer $answer,
        InterviewScore $score,
    ): void {
        $question = $answer->question;
        if (! $question) {
            return;
        }

        $normalized = $this->normalizeQuestion($question->question_text);
        if ($normalized === '') {
            return;
        }

        $topic    = $question->metadata['topic'] ?? null;
        $category = $question->category;
        $overall  = $score->overall_score;

        // Upsert mastery row: keep best score across all interviews for this user
        $existing = UserQuestionMastery::where('user_id', $user->id)
            ->where('normalized_question', $normalized)
            ->first();

        $bestScore = $existing ? max((int) $existing->best_overall_score, $overall) : $overall;
        $mastered  = $bestScore >= $this->masteryThreshold();

        UserQuestionMastery::updateOrCreate(
            ['user_id' => $user->id, 'normalized_question' => $normalized],
            [
                'topic'               => $topic,
                'category'            => $category,
                'best_overall_score'  => $bestScore,
                'mastered'            => $mastered,
                'source_interview_id' => $interview->id,
            ]
        );

        // Refresh the user memory profile
        $this->refreshMemoryProfile($user, $score, $topic, $mastered);
    }

    /**
     * Merge new strengths/weaknesses into the rolling user profile, and update
     * mastered_topics list.
     */
    private function refreshMemoryProfile(
        User $user,
        InterviewScore $score,
        ?string $topic,
        bool $mastered,
    ): void {
        $profile = UserMemoryProfile::firstOrCreate(
            ['user_id' => $user->id],
            [
                'mastered_topics'       => [],
                'strengths'             => [],
                'weaknesses'            => [],
                'interviews_completed'  => 0,
            ]
        );

        $strengths = array_values(array_unique(array_merge(
            $profile->strengths ?? [],
            $score->strengths ?? []
        )));

        $weaknesses = array_values(array_unique(array_merge(
            $profile->weaknesses ?? [],
            $score->weaknesses ?? []
        )));

        $masteredTopics = $profile->mastered_topics ?? [];
        if ($mastered && $topic && ! in_array($topic, $masteredTopics, true)) {
            $masteredTopics[] = $topic;
        }

        // Cap lists to avoid unbounded growth
        $profile->update([
            'strengths'       => array_slice($strengths, 0, 30),
            'weaknesses'      => array_slice($weaknesses, 0, 30),
            'mastered_topics' => array_values(array_unique($masteredTopics)),
        ]);
    }

    /**
     * Increment the completed-interviews counter when an interview finishes.
     */
    public function incrementInterviewsCompleted(User $user): void
    {
        $profile = UserMemoryProfile::firstOrCreate(
            ['user_id' => $user->id],
            [
                'mastered_topics'      => [],
                'strengths'            => [],
                'weaknesses'           => [],
                'interviews_completed' => 0,
            ]
        );

        $profile->increment('interviews_completed');
    }

    /**
     * Normalise question text the same way GenerateQuestionJob does.
     */
    public function normalizeQuestion(string $question): string
    {
        $text = preg_replace('/\s*\(follow-up\s*#\d+\)\s*$/i', '', trim($question)) ?? trim($question);
        $text = preg_replace('/\s*\(additional detail\s*#\d+\)\s*$/i', '', $text) ?? $text;

        return mb_strtolower($text);
    }
}
