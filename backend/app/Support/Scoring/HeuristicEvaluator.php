<?php

namespace App\Support\Scoring;

class HeuristicEvaluator
{
    private const TECH_TERMS = [
        'laravel', 'php', 'mysql', 'api', 'rest', 'mvc', 'eloquent', 'database', 'javascript', 'vue', 'react',
    ];

    public static function fixedResult(string $type): array
    {
        return ScoringConstants::get("heuristic.fixedScores.{$type}", []);
    }

    public static function evaluate(
        string $question,
        string $transcript,
        string $category,
        array $requiredSkills,
        bool $poorQuality,
        callable $modelAnswerFor,
    ): array {
        $wordCount = str_word_count($transcript);
        $textLower = mb_strtolower($transcript);
        $words = preg_split('/\s+/u', $transcript, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $uniqueRatio = count(array_unique(array_map('mb_strtolower', $words))) / max(count($words), 1);

        $h = ScoringConstants::get('heuristic');
        $base = $h['baseStart'] + min($wordCount, $h['wordCountCap']);

        $skillHits = 0;
        foreach (array_slice($requiredSkills, 0, 10) as $skill) {
            if ($skill !== '' && str_contains($textLower, mb_strtolower((string) $skill))) {
                $skillHits++;
            }
        }
        $base += min($skillHits * $h['skillHitBonus'], $h['skillHitCap']);

        $hasTechnicalTerms = false;
        foreach (self::TECH_TERMS as $term) {
            if (str_contains($textLower, $term)) {
                $hasTechnicalTerms = true;
                break;
            }
        }

        if (in_array($category, ['technical', 'problem_solving'], true) && $hasTechnicalTerms) {
            $base += $h['techTermBonus'];
        }

        $tooBrief = $wordCount < $h['tooBriefWordCount'];
        if ($tooBrief) {
            $base -= $h['tooBriefPenalty'];
        }
        if ($poorQuality) {
            $base -= $h['poorQualityPenalty'];
        }
        if ($uniqueRatio < $h['repetitionRatio'] && $wordCount > $h['repetitionMinWords']) {
            $base -= $h['repetitionPenalty'];
        }

        $offsets = $h['categoryOffsets'] ?? [];
        $base += $offsets[$category] ?? 0;
        $base = max($h['baseMin'], min($h['baseMax'], $base));

        $strengths = [];
        $weaknesses = [];

        if ($wordCount >= 20 && ! $tooBrief) {
            $strengths[] = 'Provided a substantive spoken response';
        }
        if ($skillHits >= 2) {
            $strengths[] = "Mentioned {$skillHits} relevant skills from the role";
        } elseif ($skillHits === 1) {
            $strengths[] = 'Referenced a skill relevant to the position';
        }
        if (in_array($category, ['technical', 'problem_solving'], true) && $hasTechnicalTerms) {
            $strengths[] = 'Used technical terminology appropriately';
        }
        if ($category === 'behavioral' && $wordCount >= 25 && preg_match('/\b(project|team|worked|delivered)\b/i', $transcript)) {
            $strengths[] = 'Described relevant work experience';
        }

        $missingSkills = $skillHits === 0;
        $missingTechnicalTerms = in_array($category, ['technical', 'problem_solving'], true) && ! $hasTechnicalTerms;
        $repetitive = $uniqueRatio < $h['repetitionRatio'] && $wordCount > $h['repetitionMinWords'];
        $weakTieIn = $wordCount >= 40 && $skillHits === 0;

        if ($tooBrief) {
            $weaknesses[] = 'Answer was too brief — add a concrete example with actions and outcome';
        }
        if ($poorQuality) {
            $weaknesses[] = 'Transcription quality may be poor';
        }
        if ($missingSkills && in_array($category, ['technical', 'problem_solving'], true)) {
            $weaknesses[] = 'Did not mention specific tools or technologies from the job';
        } elseif ($missingSkills) {
            $weaknesses[] = 'Did not connect the answer to role requirements';
        }
        if ($missingTechnicalTerms) {
            $weaknesses[] = 'Did not explain the technical approach or Laravel concepts asked about';
        }
        if ($repetitive) {
            $weaknesses[] = 'Response had repetitive phrasing';
        }
        if ($weakTieIn) {
            $weaknesses[] = 'Could tie your experience more directly to the role requirements';
        }

        $recommendations = self::targetedRecommendations(
            $category,
            $tooBrief,
            $missingSkills,
            $missingTechnicalTerms,
            $repetitive,
            $weakTieIn
        );

        $modelThreshold = ScoringConstants::threshold('modelAnswer');
        $showModel = $base < $modelThreshold || $weaknesses !== [];

        return [
            'score' => $base,
            'relevance' => max($h['baseMin'], min(100, $base + ($skillHits ? 2 : -4))),
            'technical_accuracy' => max($h['baseMin'], min(100, $base - ($missingTechnicalTerms ? 8 : 4))),
            'communication' => max($h['baseMin'], min(100, $base - ($poorQuality ? 12 : 0))),
            'confidence' => max($h['baseMin'], min(100, $base - 2)),
            'completeness' => max($h['baseMin'], min(100, $base - ($tooBrief ? 10 : 0))),
            'strengths' => $strengths,
            'weaknesses' => $weaknesses,
            'recommendations' => $recommendations,
            'model_answer' => $showModel ? $modelAnswerFor($question, $category) : null,
            'transcript_quality_poor' => $poorQuality,
        ];
    }

    private static function targetedRecommendations(
        string $category,
        bool $tooBrief,
        bool $missingSkills,
        bool $missingTechnicalTerms,
        bool $repetitive,
        bool $weakTieIn,
    ): array {
        $picks = [];

        if ($tooBrief) {
            $picks[] = 'Expand with a concrete example: what you did, how you did it, and the outcome';
        }
        if ($missingSkills && in_array($category, ['technical', 'problem_solving'], true)) {
            $picks[] = 'Name specific tools from the job description (e.g. Laravel, MySQL, REST APIs)';
        } elseif ($missingSkills) {
            $picks[] = 'Connect your answer to skills or requirements mentioned in the job description';
        }
        if ($missingTechnicalTerms && in_array($category, ['technical', 'problem_solving'], true)) {
            $picks[] = 'Explain the Laravel approach: routes, controllers, validation, auth, and database layer';
        }
        if ($repetitive) {
            $picks[] = 'Avoid repeating the same phrases — add new details in each sentence';
        }
        if ($weakTieIn) {
            $picks[] = 'Tie your experience more directly to the role you are interviewing for';
        }
        if ($category === 'behavioral' && ! $tooBrief && count($picks) < 2) {
            $picks[] = 'Structure with Situation, Task, Action, and Result when describing past experience';
        }
        if ($category === 'problem_solving' && ! $missingTechnicalTerms && count($picks) < 2) {
            $picks[] = 'Walk through diagnosis steps, the fix you applied, and how you verified it worked';
        }
        if ($category === 'scenario' && count($picks) < 2) {
            $picks[] = 'State your priorities first, then the actions you would take';
        }
        if ($category === 'communication' && count($picks) < 2) {
            $picks[] = 'Lead with your main point, then support it with one specific example';
        }

        if ($picks === []) {
            $picks[] = 'Add one more specific detail or metric to strengthen this answer';
        }

        return array_slice($picks, 0, 2);
    }
}
