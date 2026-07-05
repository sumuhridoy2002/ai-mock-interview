<?php

namespace Tests\Feature;

use App\Support\Scoring\ReportAggregator;
use App\Support\Scoring\ScoringConstants;
use Tests\TestCase;

class ScoringConstantsTest extends TestCase
{
    public function test_hiring_recommendation_matches_constants(): void
    {
        $this->assertSame('strong_yes', ReportAggregator::hiringRecommendation(90));
        $this->assertSame('yes', ReportAggregator::hiringRecommendation(75));
        $this->assertSame('maybe', ReportAggregator::hiringRecommendation(60));
        $this->assertSame('no', ReportAggregator::hiringRecommendation(45));
        $this->assertSame('strong_no', ReportAggregator::hiringRecommendation(20));
    }

    public function test_overall_score_average(): void
    {
        $scores = [
            ['score' => 80, 'category' => 'technical'],
            ['score' => 60, 'category' => 'behavioral'],
        ];
        $this->assertSame(70, ReportAggregator::overallScore($scores));
    }

    public function test_constants_load_mastery_threshold(): void
    {
        $this->assertSame(60, ScoringConstants::threshold('mastery'));
        $this->assertSame(70, ScoringConstants::threshold('pass'));
    }
}
