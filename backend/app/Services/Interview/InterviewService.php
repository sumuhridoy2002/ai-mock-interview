<?php

namespace App\Services\Interview;

use App\Events\InterviewCompleted;
use App\Jobs\AnalyzeInterviewSnapshotsJob;
use App\Jobs\AnalyzeJobDescriptionJob;
use App\Jobs\GenerateQuestionJob;
use App\Jobs\GenerateReportJob;
use App\Models\AgentMemory;
use App\Models\Interview;
use App\Models\InterviewAnswer;
use App\Models\InterviewQuestion;
use App\Models\InterviewSession;
use App\Models\User;
use App\Models\UserMemoryProfile;
use App\Models\UserQuestionMastery;
use Illuminate\Support\Str;

class InterviewService
{
    public function __construct(
        private readonly AiGatewayService $aiGateway,
    ) {}

    public function maxQuestions(): int
    {
        return (int) config('interview.max_questions', 10);
    }

    public function questionCount(Interview $interview): int
    {
        return $interview->questions()->count();
    }

    public function answeredCount(Interview $interview): int
    {
        return $interview->questions()->whereHas('answer')->count();
    }

    public function hasReachedQuestionLimit(Interview $interview): bool
    {
        return $this->questionCount($interview) >= $this->maxQuestions();
    }

    public function hasAnsweredAllQuestions(Interview $interview): bool
    {
        return $this->answeredCount($interview) >= $this->maxQuestions();
    }

    public function create(User $user, array $data): Interview
    {
        $interview = Interview::create([
            'user_id'          => $user->id,
            'resume_id'        => $data['resume_id'],
            'job_title'        => $data['job_title'],
            'job_description'  => $data['job_description'],
            'experience_level' => $data['experience_level'],
            'interview_type'   => $data['interview_type'],
            'status'           => 'setup',
            'scheduled_at'     => $data['scheduled_at'] ?? null,
            'alarm_message'    => $data['alarm_message'] ?? null,
        ]);

        AnalyzeJobDescriptionJob::dispatch($interview);

        return $interview;
    }

    public function updateSchedule(Interview $interview, ?string $scheduledAt, ?string $alarmMessage): Interview
    {
        $interview->update([
            'scheduled_at'       => $scheduledAt,
            'alarm_message'      => $alarmMessage,
            'alarm_triggered_at' => null,
            'reminder_sent_at'   => null,
        ]);

        return $interview->fresh();
    }

    public function clearSchedule(Interview $interview): Interview
    {
        $interview->update([
            'scheduled_at'       => null,
            'alarm_message'      => null,
            'alarm_triggered_at' => null,
            'reminder_sent_at'   => null,
        ]);

        return $interview->fresh();
    }

    public function markAlarmTriggered(Interview $interview): void
    {
        $interview->update(['alarm_triggered_at' => now()]);
    }

    public function start(Interview $interview): InterviewSession
    {
        $session = InterviewSession::create([
            'interview_id' => $interview->id,
            'session_uuid' => (string) Str::uuid(),
            'phase' => 'intro',
            'current_question_index' => 0,
            'started_at' => now(),
        ]);

        AgentMemory::create([
            'interview_session_id' => $session->id,
            'questions_asked' => [],
            'answers_summary' => [],
            'candidate_strengths' => [],
            'candidate_weaknesses' => [],
            'topics_covered' => [],
        ]);

        $interview->update(['status' => 'active']);
        $session->update(['phase' => 'questioning']);

        if (! $this->hasReachedQuestionLimit($interview)) {
            GenerateQuestionJob::dispatchSync($interview, $session);
        }

        return $session->fresh();
    }

    public function submitAnswer(
        Interview $interview,
        InterviewQuestion $question,
        ?string $transcript,
        ?string $audioPath,
        string $idempotencyKey,
        ?int $durationSeconds = null,
        ?string $videoPath = null,
    ): InterviewAnswer {
        $existing = InterviewAnswer::where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return $existing;
        }

        $existingForQuestion = InterviewAnswer::where('interview_question_id', $question->id)->first();
        if ($existingForQuestion) {
            $existingForQuestion->update([
                'transcript' => $transcript ?? $existingForQuestion->transcript,
                'audio_path' => $audioPath ?? $existingForQuestion->audio_path,
                'video_path' => $videoPath ?? $existingForQuestion->video_path,
                'duration_seconds' => $durationSeconds ?? $existingForQuestion->duration_seconds,
            ]);

            return $existingForQuestion->fresh();
        }

        return InterviewAnswer::create([
            'interview_question_id' => $question->id,
            'transcript' => $transcript,
            'audio_path' => $audioPath,
            'video_path' => $videoPath,
            'duration_seconds' => $durationSeconds,
            'idempotency_key' => $idempotencyKey,
        ]);
    }

    public function complete(Interview $interview): void
    {
        if ($interview->status === 'completed') {
            if (! $interview->report) {
                GenerateReportJob::dispatchSync($interview->fresh());
            }
            if (empty($interview->report?->behavior_summary['by_answer'] ?? null)) {
                AnalyzeInterviewSnapshotsJob::dispatch($interview->fresh());
            }

            return;
        }

        $interview->session?->update([
            'phase' => 'completed',
            'ended_at' => now(),
        ]);

        $interview->update(['status' => 'completed']);

        GenerateReportJob::dispatchSync($interview->fresh());
        AnalyzeInterviewSnapshotsJob::dispatch($interview->fresh());

        // Bump the user's completed-interview counter in their memory profile
        $user = $interview->user;
        if ($user) {
            UserMemoryProfile::firstOrCreate(
                ['user_id' => $user->id],
                ['mastered_topics' => [], 'strengths' => [], 'weaknesses' => [], 'interviews_completed' => 0]
            )->increment('interviews_completed');
        }

        if ($session = $interview->session) {
            event(new InterviewCompleted($interview, $session));
        }
    }

    public function buildInterviewHistory(Interview $interview): array
    {
        $history = [];

        foreach ($interview->questions()->with('answer.score')->orderBy('sequence')->get() as $question) {
            if (! $question->answer) {
                continue;
            }

            $history[] = [
                'sequence' => $question->sequence,
                'question' => $question->question_text,
                'answer' => $question->answer->transcript ?? '',
                'category' => $question->category,
                'score' => $question->answer->score?->overall_score,
                'strengths' => $question->answer->score?->strengths ?? [],
                'weaknesses' => $question->answer->score?->weaknesses ?? [],
                'recommendations' => $question->answer->score?->recommendations ?? [],
            ];
        }

        return $history;
    }

    /**
     * Build the cross-interview user memory payload for the AI question generator.
     * Returns mastered questions (normalized text), mastered topics, and rolling
     * strengths/weaknesses from all past interviews.
     */
    public function buildUserMemoryPayload(User $user): array
    {
        $profile = $user->memoryProfile;

        $masteredQuestions = UserQuestionMastery::where('user_id', $user->id)
            ->where('mastered', true)
            ->pluck('normalized_question')
            ->all();

        return [
            'mastered_questions' => $masteredQuestions,
            'mastered_topics'    => $profile?->mastered_topics ?? [],
            'prior_strengths'    => $profile?->strengths ?? [],
            'prior_weaknesses'   => $profile?->weaknesses ?? [],
            'interviews_completed' => $profile?->interviews_completed ?? 0,
        ];
    }

    public function buildMemoryPayload(InterviewSession $session): array
    {
        $memory = $session->latestMemory();

        return [
            'questions_asked' => $memory?->questions_asked ?? [],
            'answers_summary' => $memory?->answers_summary ?? [],
            'candidate_strengths' => $memory?->candidate_strengths ?? [],
            'candidate_weaknesses' => $memory?->candidate_weaknesses ?? [],
            'topics_covered' => $memory?->topics_covered ?? [],
        ];
    }
}
