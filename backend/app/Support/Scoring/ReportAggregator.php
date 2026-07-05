<?php

namespace App\Support\Scoring;

class ReportAggregator
{
    public static function overallScore(array $scores): int
    {
        if ($scores === []) {
            return (int) ScoringConstants::get('report.defaultOverall', 50);
        }

        return (int) round(array_sum(array_column($scores, 'score')) / count($scores));
    }

    public static function categoryScores(array $scores): array
    {
        $categoryTotals = [];
        foreach ($scores as $item) {
            $cat = $item['category'] ?? 'general';
            $categoryTotals[$cat][] = $item['score'] ?? 0;
        }

        $categoryScores = [];
        foreach ($categoryTotals as $cat => $values) {
            $categoryScores[$cat] = (int) round(array_sum($values) / count($values));
        }

        return $categoryScores;
    }

    public static function hiringRecommendation(int $score): string
    {
        if ($score >= ScoringConstants::hiringThreshold('strong_yes')) {
            return 'strong_yes';
        }
        if ($score >= ScoringConstants::hiringThreshold('yes')) {
            return 'yes';
        }
        if ($score >= ScoringConstants::hiringThreshold('maybe')) {
            return 'maybe';
        }
        if ($score >= ScoringConstants::hiringThreshold('no')) {
            return 'no';
        }

        return 'strong_no';
    }
}
