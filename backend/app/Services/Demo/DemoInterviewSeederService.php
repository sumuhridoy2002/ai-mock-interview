<?php

namespace App\Services\Demo;

use App\Models\AgentMemory;
use App\Models\AnswerBehavior;
use App\Models\Interview;
use App\Models\InterviewAnswer;
use App\Models\InterviewQuestion;
use App\Models\InterviewReport;
use App\Models\InterviewScore;
use App\Models\InterviewSession;
use App\Models\Resume;
use App\Models\User;
use App\Models\UserMemoryProfile;
use App\Services\Interview\EvaluationService;
use App\Services\Interview\MasteryService;
use App\Services\Interview\ReportService;
use App\Support\Scoring\BehaviorAggregator;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoInterviewSeederService
{
    public function __construct(
        private readonly DemoMediaFactory $media,
        private readonly EvaluationService $evaluation,
        private readonly ReportService $reportService,
        private readonly MasteryService $mastery,
    ) {}

    /**
     * @return array{created: int, user_id: int}
     */
    public function seed(User $user, int $count = 20, bool $withPdf = true): array
    {
        $profiles = require database_path('seeders/data/demo-profiles.php');
        $profiles = array_slice($profiles, 0, $count);

        $resume = $this->ensureResume($user);
        $this->media->ensureSampleVideo();

        $created = 0;

        DB::transaction(function () use ($user, $profiles, $resume, $withPdf, &$created) {
            foreach ($profiles as $index => $profile) {
                $this->seedOneInterview($user, $resume, $profile, $index, $withPdf);
                $created++;
            }

            $this->refreshUserMemoryProfile($user);
        });

        return ['created' => $created, 'user_id' => $user->id];
    }

    public function purgeDemoInterviews(User $user): int
    {
        $interviews = $user->interviews()->get(['id', 'full_video_path']);
        if ($interviews->isEmpty()) {
            return 0;
        }

        foreach ($interviews as $interview) {
            \Illuminate\Support\Facades\Storage::disk('local')->deleteDirectory('interviews/'.$interview->id);
        }

        return Interview::whereIn('id', $interviews->pluck('id'))->delete();
    }

    private function ensureResume(User $user): Resume
    {
        $existing = $user->resumes()->where('status', 'parsed')->first();
        if ($existing) {
            return $existing;
        }

        $path = 'resumes/demo-seed.pdf';
        \Illuminate\Support\Facades\Storage::disk('local')->put($path, '%PDF-1.4 demo resume placeholder');

        return Resume::create([
            'user_id' => $user->id,
            'original_filename' => 'demo-cv.pdf',
            'storage_path' => $path,
            'mime_type' => 'application/pdf',
            'parsed_profile' => [
                'skills' => ['Laravel', 'PHP', 'MySQL', 'REST API', 'JavaScript', 'Git', 'PHPUnit'],
                'experience_years' => 3,
                'summary' => 'Full-stack Laravel developer with production API and dashboard experience.',
            ],
            'file_hash' => hash('sha256', 'demo-seed-resume-'.$user->id),
            'status' => 'parsed',
        ]);
    }

    /**
     * @param  array<string, mixed>  $profile
     */
    private function seedOneInterview(User $user, Resume $resume, array $profile, int $index, bool $withPdf): void
    {
        $daysAgo = 90 - ($index * 4);
        $startedAt = Carbon::now()->subDays($daysAgo)->subMinutes(45);
        $endedAt = (clone $startedAt)->addMinutes(38);

        $jobTitle = $profile['job_title'];
        $skills = $profile['skills'];

        $interview = Interview::create([
            'user_id' => $user->id,
            'resume_id' => $resume->id,
            'job_title' => $jobTitle,
            'job_description' => $this->jobDescription($jobTitle, $skills),
            'job_analysis' => ['required_skills' => $skills, 'seniority' => $profile['experience_level']],
            'experience_level' => $profile['experience_level'],
            'interview_type' => $profile['interview_type'],
            'status' => 'completed',
            'full_video_path' => null,
            'created_at' => $startedAt,
            'updated_at' => $endedAt,
        ]);

        $session = InterviewSession::create([
            'interview_id' => $interview->id,
            'session_uuid' => (string) Str::uuid(),
            'phase' => 'completed',
            'current_question_index' => 8,
            'started_at' => $startedAt,
            'ended_at' => $endedAt,
        ]);

        AgentMemory::create([
            'interview_session_id' => $session->id,
            'questions_asked' => [],
            'answers_summary' => [],
            'candidate_strengths' => ['Clear communication', 'Laravel experience'],
            'candidate_weaknesses' => ['Could add more metrics'],
            'topics_covered' => $skills,
        ]);

        $tier = $profile['tier'] ?? 'mid';
        $questions = $this->questionsForType($profile['interview_type']);
        $byAnswerBehavior = [];
        $visualSeed = $interview->id * 100 + $index;

        foreach ($questions as $qIndex => $q) {
            $sequence = $qIndex + 1;
            $question = InterviewQuestion::create([
                'interview_id' => $interview->id,
                'sequence' => $sequence,
                'category' => $q['category'],
                'question_text' => $q['text'],
                'metadata' => ['topic' => $q['topic'] ?? $q['category']],
                'source' => 'generated',
            ]);

            $transcript = $this->transcriptFor($q['text'], $q['category'], $jobTitle, $tier);
            $evaluation = $this->evaluation->buildLocalEvaluation(
                $q['text'],
                $transcript,
                $q['category'],
                $skills,
            );

            $answer = InterviewAnswer::create([
                'interview_question_id' => $question->id,
                'transcript' => $transcript,
                'audio_path' => null,
                'video_path' => null,
                'duration_seconds' => random_int(45, 120),
                'idempotency_key' => (string) Str::uuid(),
            ]);

            $score = InterviewScore::create([
                'interview_answer_id' => $answer->id,
                'relevance' => $evaluation['relevance'] ?? 0,
                'technical_accuracy' => $evaluation['technical_accuracy'] ?? 0,
                'communication' => $evaluation['communication'] ?? 0,
                'confidence' => $evaluation['confidence'] ?? 0,
                'completeness' => $evaluation['completeness'] ?? 0,
                'overall_score' => $evaluation['score'] ?? 0,
                'strengths' => $evaluation['strengths'] ?? [],
                'weaknesses' => $evaluation['weaknesses'] ?? [],
                'recommendations' => $evaluation['recommendations'] ?? [],
                'raw_ai_response' => $evaluation,
            ]);

            [$conf, $nerv] = $this->behaviorMetricsForTier($tier);
            AnswerBehavior::create([
                'interview_answer_id' => $answer->id,
                'confidence' => $conf,
                'nervousness' => $nerv,
                'eye_contact_ratio' => round(0.5 + $conf / 200, 3),
                'head_stability' => round(0.6 + $conf / 300, 3),
                'blink_rate' => (float) random_int(12, 20),
                'emotion_distribution' => ['neutral' => 0.5, 'happy' => 0.25],
                'prosody' => ['pitch_variance' => random_int(20, 45)],
                'coaching_narrative' => 'Seeded demo behavior analysis for gallery and charts.',
            ]);

            $snapshotCount = random_int(4, 6);
            $this->media->generateAnswerSnapshots($interview->id, $answer->id, $snapshotCount, $visualSeed + $sequence);
            $byAnswerBehavior[(string) $answer->id] = $this->media->snapshotBehaviorPayload($snapshotCount, $conf, $nerv);

            $this->mastery->recordAnswer($user, $interview, $answer, $score);
        }

        $videoPath = $this->media->copyFullSessionVideo($interview->id);
        $interview->update(['full_video_path' => $videoPath]);

        $interview->refresh();
        $interview->load('questions.answer.score', 'questions.answer.behavior');

        $payload = $this->reportService->buildPayload($interview);
        $reportData = $this->reportService->buildLocalReport($payload);
        $reportData['question_reviews'] = $payload['question_reviews'] ?? [];

        if ($withPdf) {
            $this->reportService->generate($interview, $reportData);
        } else {
            InterviewReport::updateOrCreate(
                ['interview_id' => $interview->id],
                [
                    'overall_score' => $reportData['overall_score'],
                    'category_scores' => $reportData['category_scores'],
                    'strengths' => $reportData['strengths'],
                    'weaknesses' => $reportData['weaknesses'],
                    'improvement_areas' => $reportData['improvement_areas'],
                    'hiring_recommendation' => $reportData['hiring_recommendation'],
                    'report_json' => $reportData,
                    'pdf_path' => null,
                ],
            );
        }

        $behaviorSummary = BehaviorAggregator::aggregate(
            array_values($byAnswerBehavior),
            array_sum(array_map(fn ($b) => $b['snapshots_count'], $byAnswerBehavior)),
            $byAnswerBehavior,
        );

        $interview->report?->update(['behavior_summary' => $behaviorSummary]);
    }

    private function refreshUserMemoryProfile(User $user): void
    {
        $completed = $user->interviews()->where('status', 'completed')->count();
        UserMemoryProfile::updateOrCreate(
            ['user_id' => $user->id],
            ['interviews_completed' => $completed],
        );
    }

    /**
     * @return list<array{text: string, category: string, topic?: string}>
     */
    private function questionsForType(string $type): array
    {
        $bank = [
            ['text' => 'Tell me about yourself and why you are a fit for this role.', 'category' => 'behavioral', 'topic' => 'introduction'],
            ['text' => 'How would you structure a REST API in Laravel for a Vue dashboard?', 'category' => 'technical', 'topic' => 'api'],
            ['text' => 'Describe a time you fixed a performance bug in production.', 'category' => 'problem_solving', 'topic' => 'debugging'],
            ['text' => 'Tell me about collaborating under a tight deadline.', 'category' => 'behavioral', 'topic' => 'teamwork'],
            ['text' => 'What would you focus on in your first 30 days in this role?', 'category' => 'scenario', 'topic' => 'onboarding'],
            ['text' => 'Explain Eloquent relationships and when you would eager-load.', 'category' => 'technical', 'topic' => 'eloquent'],
            ['text' => 'Describe a Laravel project you are proud of.', 'category' => 'technical', 'topic' => 'projects'],
            ['text' => 'How do you handle queue workers and failed jobs?', 'category' => 'technical', 'topic' => 'queues'],
        ];

        if ($type === 'behavioral') {
            return array_slice([
                $bank[0], $bank[3],
                ['text' => 'Describe a conflict with a teammate and how you resolved it.', 'category' => 'behavioral', 'topic' => 'conflict'],
                ['text' => 'What is your greatest weakness as a developer?', 'category' => 'communication', 'topic' => 'self-awareness'],
                $bank[4], $bank[6], $bank[1], $bank[2],
            ], 0, 8);
        }

        if ($type === 'technical') {
            return $bank;
        }

        return $bank;
    }

    private function transcriptFor(string $question, string $category, string $jobTitle, string $tier): string
    {
        if ($tier === 'weak' && random_int(0, 3) === 0) {
            return 'Sorry, I am not sure how to answer that question right now.';
        }

        $article = $this->evaluation->detailedAnswerArticle($question, $category, $jobTitle);

        if ($tier === 'weak') {
            return mb_substr($article, 0, 280).' I would need more practice articulating metrics.';
        }

        if ($tier === 'mid') {
            return mb_substr($article, 0, 900);
        }

        return $article;
    }

    /**
     * @param  list<string>  $skills
     */
    private function jobDescription(string $jobTitle, array $skills): string
    {
        $skillList = implode(', ', $skills);

        return "We are hiring a {$jobTitle}. Required skills: {$skillList}. "
            .'You will build Laravel APIs, write tests, collaborate with frontend developers, and ship features to production.';
    }

    /** @return array{0: int, 1: int} */
    private function behaviorMetricsForTier(string $tier): array
    {
        return match ($tier) {
            'good' => [random_int(72, 88), random_int(12, 28)],
            'weak' => [random_int(45, 58), random_int(42, 62)],
            default => [random_int(58, 72), random_int(28, 45)],
        };
    }
}
