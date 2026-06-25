<?php

namespace App\Services\Interview;

use App\Models\Interview;
use App\Models\InterviewReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class ReportService
{
    public function __construct(
        private readonly AiGatewayService $aiGateway,
        private readonly InterviewService $interviewService,
    ) {}

    public function generate(Interview $interview, array $reportData): InterviewReport
    {
        $interview->loadMissing('user');

        $pdfPath = $this->storePdf($interview, $reportData);

        return InterviewReport::updateOrCreate(
            ['interview_id' => $interview->id],
            [
                'overall_score' => $reportData['overall_score'],
                'category_scores' => $reportData['category_scores'],
                'strengths' => $reportData['strengths'],
                'weaknesses' => $reportData['weaknesses'],
                'improvement_areas' => $reportData['improvement_areas'],
                'hiring_recommendation' => $reportData['hiring_recommendation'],
                'report_json' => $reportData,
                'pdf_path' => $pdfPath,
            ]
        );
    }

    public function buildPayload(Interview $interview): array
    {
        $scores = [];
        $questionReviews = [];
        $memory = $interview->session
            ? $this->interviewService->buildMemoryPayload($interview->session)
            : [];

        foreach ($interview->questions()->with('answer.score', 'answer.behavior')->orderBy('sequence')->get() as $question) {
            if (! $question->answer?->score) {
                continue;
            }

            $score    = $question->answer->score;
            $behavior = $question->answer->behavior;
            $raw      = $score->raw_ai_response ?? [];
            $overall  = $score->overall_score;
            $modelAnswer  = $raw['model_answer'] ?? null;
            $weaknesses   = $score->weaknesses ?? [];
            $poorQuality  = in_array('Transcription quality may be poor', $weaknesses, true)
                || ($raw['transcript_quality_poor'] ?? false);
            $needsImprovement = $overall < 80 || $weaknesses !== [] || $poorQuality;

            if (! $modelAnswer && $needsImprovement) {
                $modelAnswer = app(EvaluationService::class)->modelAnswerFor(
                    $question->question_text,
                    $question->category
                );
            }

            $behaviorSummary = $behavior ? [
                'confidence'         => $behavior->confidence,
                'nervousness'        => $behavior->nervousness,
                'eye_contact_ratio'  => $behavior->eye_contact_ratio,
                'head_stability'     => $behavior->head_stability,
                'blink_rate'         => $behavior->blink_rate,
                'emotion_distribution' => $behavior->emotion_distribution,
                'prosody'            => $behavior->prosody,
                'coaching_narrative' => $behavior->coaching_narrative,
            ] : null;

            $scores[] = [
                'question'   => $question->question_text,
                'category'   => $question->category,
                'score'      => $overall,
                'strengths'  => $score->strengths,
                'weaknesses' => $score->weaknesses,
            ];

            $questionReviews[] = [
                'sequence'               => $question->sequence,
                'question'               => $question->question_text,
                'category'               => $question->category,
                'your_answer'            => $question->answer->transcript ?? '',
                'score'                  => $overall,
                'relevance'              => $score->relevance,
                'technical_accuracy'     => $score->technical_accuracy,
                'communication'          => $score->communication,
                'confidence'             => $score->confidence,
                'completeness'           => $score->completeness,
                'strengths'              => $score->strengths ?? [],
                'weaknesses'             => $score->weaknesses ?? [],
                'recommendations'        => $score->recommendations ?? [],
                'model_answer'           => $modelAnswer,
                'needs_improvement'      => $needsImprovement,
                'transcript_quality_poor' => $poorQuality,
                'behavior'               => $behaviorSummary,
            ];
        }

        // Aggregate behavior across all questions
        $behaviorItems = array_filter(array_column($questionReviews, 'behavior'));
        $aggregateBehavior = $this->aggregateBehavior($behaviorItems);

        return [
            'interview' => [
                'job_title'       => $interview->job_title,
                'experience_level' => $interview->experience_level,
                'interview_type'  => $interview->interview_type,
            ],
            'cv_profile'       => $interview->resume?->parsed_profile ?? [],
            'job_analysis'     => $interview->job_analysis ?? [],
            'scores'           => $scores,
            'question_reviews' => $questionReviews,
            'memory'           => $memory,
            'behavior_summary' => $aggregateBehavior,
        ];
    }

    public function buildLocalReport(array $payload): array
    {
        $scores = $payload['scores'] ?? [];
        $memory = $payload['memory'] ?? [];

        $overall = 50;
        if (count($scores) > 0) {
            $overall = (int) round(array_sum(array_column($scores, 'score')) / count($scores));
        }

        $categoryTotals = [];
        foreach ($scores as $item) {
            $cat = $item['category'] ?? 'general';
            $categoryTotals[$cat][] = $item['score'] ?? 0;
        }

        $categoryScores = [];
        foreach ($categoryTotals as $cat => $values) {
            $categoryScores[$cat] = (int) round(array_sum($values) / count($values));
        }
        if ($categoryScores === []) {
            $categoryScores = ['overall' => $overall];
        }

        $strengths = [];
        $weaknesses = [];
        foreach ($scores as $item) {
            $strengths = array_merge($strengths, $item['strengths'] ?? []);
            $weaknesses = array_merge($weaknesses, $item['weaknesses'] ?? []);
        }
        $strengths = array_values(array_unique(array_merge($strengths, $memory['candidate_strengths'] ?? [])));
        $weaknesses = array_values(array_unique(array_merge($weaknesses, $memory['candidate_weaknesses'] ?? [])));

        $strengths = array_slice($strengths, 0, 8);
        $strengths = array_values(array_filter($strengths, fn ($s) => ! in_array($s, [
            'Addressed the question',
            'Attempted to address the question',
        ], true)));
        if ($strengths === []) {
            $strengths = ['Participated in the interview'];
        }

        $weaknesses = array_slice($weaknesses, 0, 8) ?: ['Room for deeper, more specific examples'];
        $improvementAreas = $this->dedupeImprovementAreas($weaknesses);

        return [
            'overall_score' => $overall,
            'category_scores' => $categoryScores,
            'strengths' => $strengths,
            'weaknesses' => $weaknesses,
            'improvement_areas' => $improvementAreas,
            'hiring_recommendation' => $this->hiringRecommendation($overall),
            'question_reviews' => $payload['question_reviews'] ?? [],
        ];
    }

    private function dedupeImprovementAreas(array $areas): array
    {
        if ($areas === []) {
            return ['Practice structured answers using the STAR method for behavioral questions'];
        }

        $filtered = [];
        $starAdded = false;

        foreach ($areas as $area) {
            if (stripos($area, 'STAR') !== false || stripos($area, 'Situation, Task, Action') !== false) {
                if (! $starAdded) {
                    $filtered[] = 'Practice structured answers using the STAR method for behavioral questions';
                    $starAdded = true;
                }

                continue;
            }

            $filtered[] = $area;
        }

        return array_values(array_unique($filtered));
    }

    private function hiringRecommendation(int $score): string
    {
        if ($score >= 85) {
            return 'strong_yes';
        }
        if ($score >= 70) {
            return 'yes';
        }
        if ($score >= 55) {
            return 'maybe';
        }
        if ($score >= 40) {
            return 'no';
        }

        return 'strong_no';
    }

    private function aggregateBehavior(array $items): ?array
    {
        if (empty($items)) {
            return null;
        }

        $count = count($items);
        $avg = fn (string $key) => (int) round(array_sum(array_column($items, $key)) / $count);
        $avgFloat = fn (string $key) => round(array_sum(array_column($items, $key)) / $count, 3);

        // Merge emotion distributions (average per label)
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

        return [
            'avg_confidence'       => $avg('confidence'),
            'avg_nervousness'      => $avg('nervousness'),
            'avg_eye_contact'      => $avgFloat('eye_contact_ratio'),
            'avg_head_stability'   => $avgFloat('head_stability'),
            'avg_blink_rate'       => round(array_sum(array_column($items, 'blink_rate')) / $count, 1),
            'emotion_distribution' => $emotionAvg,
            'questions_analyzed'   => $count,
        ];
    }

    private function storePdf(Interview $interview, array $reportData): string
    {
        $pdf = Pdf::loadView('reports.interview', [
            'interview' => $interview,
            'report' => $reportData,
        ]);

        $path = 'reports/'.$interview->user_id.'/interview-'.$interview->id.'.pdf';
        Storage::disk('local')->put($path, $pdf->output());

        return $path;
    }
}
