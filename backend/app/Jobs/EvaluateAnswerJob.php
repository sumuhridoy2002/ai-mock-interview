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
        AiGatewayService $aiGateway,
        InterviewService $interviewService,
        EvaluationService $evaluationService,
        TranscriptCleaner $transcriptCleaner,
    ): void {
        if ($this->answer->score) {
            return;
        }

        try {
            $question = $this->answer->question;
            $transcript = trim($this->answer->transcript ?? '');
            $transcribeContext = [
                'job_title'       => $this->interview->job_title ?? '',
                'required_skills' => $this->interview->job_analysis['required_skills'] ?? [],
                'question'        => $question?->question_text ?? '',
            ];

            if ($transcript === '' && $this->answer->audio_path) {
                $filename = basename($this->answer->audio_path);
                $transcript = $aiGateway->transcribeStoredFile($this->answer->audio_path, $filename, $transcribeContext);

                if ($transcript !== '') {
                    $this->answer->update(['transcript' => $transcript]);
                    Log::info('Transcribed answer from stored audio', [
                        'answer_id' => $this->answer->id,
                        'chars' => strlen($transcript),
                    ]);
                }
            }

            if ($transcript === '' && $this->answer->video_path) {
                $filename = basename($this->answer->video_path);
                $transcript = $aiGateway->transcribeStoredFile($this->answer->video_path, $filename, $transcribeContext);

                if ($transcript !== '') {
                    $this->answer->update(['transcript' => $transcript]);
                }
            }

            $cleaned = $transcriptCleaner->clean($transcript);
            $transcript = $cleaned['text'];
            if ($transcript !== ($this->answer->transcript ?? '')) {
                $this->answer->update(['transcript' => $transcript]);
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

            event(new AnswerEvaluated($this->interview, $this->session, $this->answer, $score));

            $this->interview->refresh();

            if ($interviewService->hasAnsweredAllQuestions($this->interview)) {
                $interviewService->complete($this->interview);

                return;
            }

            if (! $interviewService->hasReachedQuestionLimit($this->interview)) {
                GenerateQuestionJob::dispatchSync(
                    $this->interview,
                    $this->session,
                    $transcript
                );
            }
        } catch (\Throwable $e) {
            Log::error('EvaluateAnswerJob failed', [
                'answer_id' => $this->answer->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
