<?php

namespace App\Support\Scoring;

class BehaviorAggregator
{
    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<string, mixed>|null
     */
    public static function aggregate(array $items, ?int $totalSnapshots = null, ?array $byAnswer = null): ?array
    {
        if ($items === []) {
            return null;
        }

        $count = count($items);
        $avg = fn (string $key) => (int) round(array_sum(array_column($items, $key)) / $count);
        $avgFloat = fn (string $key) => round(array_sum(array_column($items, $key)) / $count, 3);

        $emotionKeys = [];
        foreach ($items as $item) {
            $emotionKeys = array_merge($emotionKeys, array_keys($item['emotion_distribution'] ?? []));
        }
        $emotionKeys = array_unique($emotionKeys);
        $emotionAvg = [];
        foreach ($emotionKeys as $label) {
            $vals = array_map(fn ($b) => $b['emotion_distribution'][$label] ?? 0, $items);
            $emotionAvg[$label] = round(array_sum($vals) / $count, 4);
        }
        arsort($emotionAvg);

        $narratives = array_filter(array_column($items, 'coaching_narrative'));
        $coaching = $narratives !== []
            ? implode(' ', array_slice($narratives, 0, 2))
            : '';

        $summary = [
            'avg_confidence'       => $avg('confidence'),
            'avg_nervousness'      => $avg('nervousness'),
            'avg_eye_contact'      => $avgFloat('eye_contact_ratio'),
            'avg_head_stability'   => $avgFloat('head_stability'),
            'avg_blink_rate'       => round(array_sum(array_column($items, 'blink_rate')) / $count, 1),
            'emotion_distribution' => $emotionAvg,
            'questions_analyzed'   => $count,
        ];

        if ($coaching !== '') {
            $summary['coaching_narrative'] = $coaching;
        }

        $suggestions = self::buildSuggestions($summary, $coaching, $byAnswer);
        if ($suggestions !== []) {
            $summary['suggestions'] = $suggestions;
        }

        if ($totalSnapshots !== null) {
            $summary['snapshots_analyzed'] = $totalSnapshots;
        }
        if ($byAnswer !== null) {
            $summary['by_answer'] = $byAnswer;
        }

        return $summary;
    }

    /**
     * @param  array<string, mixed>  $summary
     * @param  array<string, mixed>|null  $byAnswer
     * @return array<int, string>
     */
    public static function buildSuggestions(array $summary, string $coaching, ?array $byAnswer = null): array
    {
        $suggestions = [];

        $eyeContact = (float) ($summary['avg_eye_contact'] ?? 0);
        $confidence = (int) ($summary['avg_confidence'] ?? 0);
        $nervousness = (int) ($summary['avg_nervousness'] ?? 0);
        $headStability = (float) ($summary['avg_head_stability'] ?? 0);
        $blinkRate = (float) ($summary['avg_blink_rate'] ?? 0);

        if ($eyeContact < 0.5) {
            $suggestions[] = 'Look directly at the camera more often — steady eye contact signals confidence to interviewers.';
        } elseif ($eyeContact >= 0.7) {
            $suggestions[] = 'Your eye contact was strong overall — keep anchoring your gaze on the camera at the start of each answer.';
        }

        if ($nervousness >= 55) {
            $suggestions[] = 'Take a slow breath before each answer and pause briefly after the question to reduce visible nervousness.';
        }

        if ($confidence < 55) {
            $suggestions[] = 'Sit upright, relax your shoulders, and speak at a slightly slower pace to project more confidence.';
        } elseif ($confidence >= 75) {
            $suggestions[] = 'Your overall presence read as confident — maintain that composure under harder follow-up questions.';
        }

        if ($headStability < 0.6) {
            $suggestions[] = 'Minimize head movement while speaking — keep your chin level and face the camera squarely.';
        }

        if ($blinkRate > 28) {
            $suggestions[] = 'If you notice rapid blinking, blink consciously once or twice and reset before continuing your answer.';
        }

        if ($byAnswer !== null) {
            $issueFrames = 0;
            $totalFrames = 0;
            foreach ($byAnswer as $answer) {
                foreach ($answer['frame_scores'] ?? [] as $frame) {
                    $totalFrames++;
                    if (($frame['frame_status'] ?? 'issue') === 'issue') {
                        $issueFrames++;
                    }
                }
            }
            if ($totalFrames > 0 && $issueFrames / $totalFrames > 0.4) {
                $suggestions[] = 'Several snapshots showed posture or expression issues — review the red-bordered images and adjust lighting, framing, and camera height.';
            }
        }

        if ($coaching !== '') {
            $sentences = preg_split('/(?<=[.!?])\s+/', trim($coaching)) ?: [];
            foreach ($sentences as $sentence) {
                $sentence = trim($sentence);
                if ($sentence !== '') {
                    $suggestions[] = $sentence;
                }
            }
        }

        $unique = [];
        foreach ($suggestions as $item) {
            $key = strtolower($item);
            if (! isset($unique[$key])) {
                $unique[$key] = $item;
            }
        }

        return array_values(array_slice($unique, 0, 8));
    }
}
