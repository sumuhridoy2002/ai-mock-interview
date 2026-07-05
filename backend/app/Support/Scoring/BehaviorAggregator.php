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
        if ($totalSnapshots !== null) {
            $summary['snapshots_analyzed'] = $totalSnapshots;
        }
        if ($byAnswer !== null) {
            $summary['by_answer'] = $byAnswer;
        }

        return $summary;
    }
}
