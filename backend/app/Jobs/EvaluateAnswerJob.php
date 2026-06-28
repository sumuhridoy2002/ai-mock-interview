<?php

namespace App\Jobs;

use App\Events\AnswerEvaluated;
use App\Models\Interview;
use App\Models\InterviewAnswer;
use App\Models\InterviewScore;
use App\Models\InterviewSession;
use App\Services\Interview\AiGatewayService;
use App\Services\Interview\EvaluationService;
use App\Services\Interview\InterviewService;
use App\Services\Interview\MasteryService;
use App\Services\Interview\TranscriptCleaner;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class EvaluateAnswerJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Interview $interview,
        public InterviewSession $session,
        public InterviewAnswer $answer,
    ) {}

    public function handle(
        InterviewService $interviewService,
        EvaluationService $evaluationService,
        AiGatewayService $aiGateway,
        TranscriptCleaner $transcriptCleaner,
        MasteryService $masteryService,
    ): void {
        if ($this->answer->score) {
            return;
        }

        try {
            $question = $this->answer->question;
            $transcript = trim($this->answer->transcript ?? '');

            // Transcript is provided by the frontend real-time STT — no Whisper call needed.
            $cleaned = $transcriptCleaner->clean($transcript);
            $transcript = $cleaned['text'];
            if ($transcript !== ($this->answer->transcript ?? '')) {
                $this->answer->update(['transcript' => $transcript]);
            }

            // Kick off next-question generation immediately after transcription — it
            // only needs the transcript as context and can run while evaluation proceeds.
            $this->interview->refresh();
            if (
                ! $interviewService->hasAnsweredAllQuestions($this->interview) &&
                ! $interviewService->hasReachedQuestionLimit($this->interview)
            ) {
                GenerateQuestionJob::dispatch($this->interview, $this->session, $transcript);
            }

            $requiredSkills = $this->interview->job_analysis['required_skills'] ?? [];

            try {
                $evaluation = $aiGateway->evaluateAnswer([
                    'question' => $question->question_text,
                    'transcript' => $transcript,
                    'required_skills' => $requiredSkills,
                    'category' => $question->category,
                ]);
            } catch (\Throwable $e) {
                Log::warning('AI evaluation failed, using local fallback', [
                    'answer_id' => $this->answer->id,
                    'error' => $e->getMessage(),
                ]);
                $evaluation = $evaluationService->buildLocalEvaluation(
                    $question->question_text,
                    $transcript,
                    $question->category,
                    $requiredSkills,
                );
            }

            $evaluation = $evaluationService->applyTranscriptOverrides(
                $evaluation,
                $transcript,
                $question->question_text,
                $question->category,
            );

            $score = InterviewScore::create([
                'interview_answer_id' => $this->answer->id,
                'relevance' => $evaluation['relevance'] ?? $evaluation['score'] ?? 0,
                'technical_accuracy' => $evaluation['technical_accuracy'] ?? 0,
                'communication' => $evaluation['communication'] ?? 0,
                'confidence' => $evaluation['confidence'] ?? 0,
                'completeness' => $evaluation['completeness'] ?? 0,
                'overall_score' => $evaluation['score'] ?? $evaluation['overall_score'] ?? 0,
                'strengths' => $evaluation['strengths'] ?? [],
                'weaknesses' => $evaluation['weaknesses'] ?? [],
                'recommendations' => $evaluation['recommendations'] ?? [],
                'raw_ai_response' => $evaluation,
            ]);

            $memory = $this->session->latestMemory();
            if ($memory) {
                $summaries = $memory->answers_summary ?? [];
                if ($transcript !== '') {
                    $summaries[] = mb_substr($transcript, 0, 200);
                }
                $strengths = array_values(array_unique(array_merge(
                    $memory->candidate_strengths ?? [],
                    $evaluation['strengths'] ?? []
                )));
                $weaknesses = array_values(array_unique(array_merge(
                    $memory->candidate_weaknesses ?? [],
                    $evaluation['weaknesses'] ?? []
                )));
                $memory->update([
                    'answers_summary' => $summaries,
                    'candidate_strengths' => $strengths,
                    'candidate_weaknesses' => $weaknesses,
                ]);
            }

            // Persist per-user mastery so future interviews skip mastered questions/topics
            $user = $this->interview->user;
            if ($user) {
                $masteryService->recordAnswer($user, $this->interview, $this->answer, $score);
            }

            event(new AnswerEvaluated($this->interview, $this->session, $this->answer, $score));

            $this->interview->refresh();

            if ($interviewService->hasAnsweredAllQuestions($this->interview)) {
                $interviewService->complete($this->interview);
            }
        } catch (\Throwable $e) {
            Log::error('EvaluateAnswerJob failed', [
                'answer_id' => $this->answer->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
