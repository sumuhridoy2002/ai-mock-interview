<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnswerRequest;
use App\Http\Requests\StoreInterviewRequest;
use App\Http\Requests\StoreRecordingRequest;
use App\Jobs\EvaluateAnswerJob;
use App\Jobs\GenerateReportJob;
use App\Models\Interview;
use App\Models\InterviewQuestion;
use App\Services\Interview\AiGatewayService;
use App\Services\Interview\EvaluationService;
use App\Services\Interview\InterviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class InterviewController extends Controller
{
    public function __construct(
        private readonly InterviewService $interviewService,
        private readonly AiGatewayService $aiGateway,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $interviews = $request->user()
            ->interviews()
            ->with(['report:id,interview_id,overall_score,hiring_recommendation'])
            ->latest()
            ->paginate(15);

        return response()->json($interviews);
    }

    public function scheduled(Request $request): JsonResponse
    {
        $interviews = $request->user()
            ->interviews()
            ->whereNotNull('scheduled_at')
            ->whereNotIn('status', ['completed'])
            ->orderBy('scheduled_at')
            ->get(['id', 'job_title', 'status', 'scheduled_at', 'alarm_message', 'alarm_triggered_at']);

        return response()->json($interviews);
    }

    public function store(StoreInterviewRequest $request): JsonResponse
    {
        $resume = $request->user()->resumes()->findOrFail($request->integer('resume_id'));

        $interview = $this->interviewService->create($request->user(), [
            ...$request->validated(),
            'resume_id' => $resume->id,
        ]);

        return response()->json([
            'id'                  => $interview->id,
            'status'              => $interview->status,
            'scheduled_at'        => $interview->scheduled_at?->toISOString(),
            'alarm_message'       => $interview->alarm_message,
            'alarm_triggered_at'  => $interview->alarm_triggered_at?->toISOString(),
        ], 201);
    }

    public function updateSchedule(Request $request, Interview $interview): JsonResponse
    {
        $this->authorize('update', $interview);

        $request->validate([
            'scheduled_at'  => ['nullable', 'date', 'after:now'],
            'alarm_message' => ['nullable', 'string', 'max:500'],
        ]);

        $interview = $this->interviewService->updateSchedule(
            $interview,
            $request->input('scheduled_at'),
            $request->input('alarm_message'),
        );

        return response()->json([
            'id'                 => $interview->id,
            'scheduled_at'       => $interview->scheduled_at?->toISOString(),
            'alarm_message'      => $interview->alarm_message,
            'alarm_triggered_at' => $interview->alarm_triggered_at?->toISOString(),
        ]);
    }

    public function clearSchedule(Request $request, Interview $interview): JsonResponse
    {
        $this->authorize('update', $interview);

        $this->interviewService->clearSchedule($interview);

        return response()->json(['message' => 'Schedule cleared.']);
    }

    public function triggerAlarm(Request $request, Interview $interview): JsonResponse
    {
        $this->authorize('update', $interview);

        $this->interviewService->markAlarmTriggered($interview);

        return response()->json(['alarm_triggered_at' => $interview->fresh()->alarm_triggered_at?->toISOString()]);
    }

    public function start(Request $request, Interview $interview): JsonResponse
    {
        $this->authorize('update', $interview);

        if ($interview->status === 'active') {
            $session = $interview->session;
        } else {
            $session = $this->interviewService->start($interview);
        }

        return response()->json([
            'session_uuid' => $session->session_uuid,
            'reverb_channel' => 'private-interview.'.$session->session_uuid,
            'max_questions' => $this->interviewService->maxQuestions(),
        ]);
    }

    public function currentQuestion(Request $request, Interview $interview): JsonResponse
    {
        $this->authorize('view', $interview);

        $question = $interview->questions()
            ->whereDoesntHave('answer')
            ->orderBy('sequence')
            ->first();

        if (! $question) {
            return response()->json([
                'message' => 'No pending question.',
                'status' => $interview->status,
                'max_questions' => $this->interviewService->maxQuestions(),
            ], 404);
        }

        return response()->json([
            'question_id' => $question->id,
            'question' => $question->question_text,
            'sequence' => $question->sequence,
            'category' => $question->category,
            'max_questions' => $this->interviewService->maxQuestions(),
        ]);
    }

    public function submitAnswer(StoreAnswerRequest $request, Interview $interview): JsonResponse
    {
        $this->authorize('update', $interview);

        $question = InterviewQuestion::where('id', $request->integer('question_id'))
            ->where('interview_id', $interview->id)
            ->firstOrFail();

        $audioPath = null;
        $videoPath = null;
        $hasMedia = $request->hasFile('audio') || $request->hasFile('video');
        $transcript = $hasMedia ? null : $request->input('transcript');

        if ($request->hasFile('video')) {
            $videoPath = $request->file('video')->store(
                'interviews/'.$interview->id.'/video',
                'local'
            );
        }

        if ($request->hasFile('audio')) {
            $audioPath = $request->file('audio')->store(
                'interviews/'.$interview->id.'/audio',
                'local'
            );
        }

        $transcribeContext = [
            'job_title'       => $interview->job_title ?? '',
            'required_skills' => $interview->job_analysis['required_skills'] ?? [],
            'question'        => $question->question_text ?? '',
        ];

        if (! $transcript && $request->hasFile('audio')) {
            try {
                $transcript = $this->aiGateway->transcribeAudio($request->file('audio'), $transcribeContext);
            } catch (\Throwable $e) {
                Log::warning('Inline transcription failed; job will retry from stored file', [
                    'interview_id' => $interview->id,
                    'error' => $e->getMessage(),
                ]);
            }
        } elseif (! $transcript && $request->hasFile('video') && ! $request->hasFile('audio')) {
            try {
                $transcript = $this->aiGateway->transcribeAudio($request->file('video'), $transcribeContext);
            } catch (\Throwable $e) {
                Log::warning('Inline video transcription failed; job will retry from stored file', [
                    'interview_id' => $interview->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $answer = $this->interviewService->submitAnswer(
            $interview,
            $question,
            $transcript,
            $audioPath,
            $request->input('idempotency_key'),
            $request->integer('duration_seconds') ?: null,
            $videoPath,
        );

        if ($interview->session && ! $answer->score) {
            EvaluateAnswerJob::dispatchSync($interview, $interview->session, $answer);
        }

        return response()->json([
            'answer_id' => $answer->id,
            'status' => 'processing',
        ], 202);
    }

    public function answerScore(Request $request, Interview $interview, int $answerId): JsonResponse
    {
        $this->authorize('view', $interview);

        $answer = $interview->questions()
            ->with('answer.score', 'answer.behavior')
            ->get()
            ->pluck('answer')
            ->filter()
            ->firstWhere('id', $answerId);

        if (! $answer?->score) {
            return response()->json(['message' => 'Score not ready.'], 404);
        }

        $behavior = $answer->behavior;

        return response()->json([
            'score'              => $answer->score->overall_score,
            'relevance'          => $answer->score->relevance,
            'technical_accuracy' => $answer->score->technical_accuracy,
            'communication'      => $answer->score->communication,
            'confidence'         => $answer->score->confidence,
            'completeness'       => $answer->score->completeness,
            'strengths'          => $answer->score->strengths,
            'weaknesses'         => $answer->score->weaknesses,
            'recommendations'    => $answer->score->recommendations,
            'behavior'           => $behavior ? [
                'confidence'          => $behavior->confidence,
                'nervousness'         => $behavior->nervousness,
                'eye_contact_ratio'   => $behavior->eye_contact_ratio,
                'head_stability'      => $behavior->head_stability,
                'blink_rate'          => $behavior->blink_rate,
                'emotion_distribution' => $behavior->emotion_distribution,
                'coaching_narrative'  => $behavior->coaching_narrative,
            ] : null,
        ]);
    }

    public function complete(Request $request, Interview $interview): JsonResponse
    {
        $this->authorize('update', $interview);

        $this->interviewService->complete($interview);

        return response()->json(['status' => 'generating_report']);
    }

    public function report(Request $request, Interview $interview): JsonResponse
    {
        $this->authorize('view', $interview);

        $report = $interview->report;

        if (! $report) {
            return response()->json(['message' => 'Report not ready.'], 404);
        }

        $pdfUrl = $report->pdf_path
            ? url('/api/v1/interviews/'.$interview->id.'/report/pdf')
            : null;

        return response()->json([
            'report' => $report->report_json,
            'overall_score' => $report->overall_score,
            'hiring_recommendation' => $report->hiring_recommendation,
            'pdf_url' => $pdfUrl,
        ]);
    }

    public function explainQuestion(Request $request, Interview $interview, int $sequence): JsonResponse
    {
        $this->authorize('view', $interview);

        $question = InterviewQuestion::where('interview_id', $interview->id)
            ->where('sequence', $sequence)
            ->with('answer.score')
            ->first();

        if (! $question) {
            return response()->json(['message' => 'Question not found.'], 404);
        }

        $answer = $question->answer;
        $score = $answer?->score;
        $transcript = $answer?->transcript ?? '';
        $raw = $score?->raw_ai_response ?? [];
        $modelAnswer = $raw['model_answer'] ?? null;

        if (! $modelAnswer && $score) {
            $modelAnswer = app(EvaluationService::class)->modelAnswerFor(
                $question->question_text,
                $question->category
            );
        }

        try {
            $explanation = $this->aiGateway->explainAnswer([
                'question' => $question->question_text,
                'transcript' => $transcript,
                'category' => $question->category,
                'job_title' => $interview->job_title,
                'score' => $score?->overall_score ?? 0,
                'strengths' => $score?->strengths ?? [],
                'weaknesses' => array_values(array_unique(array_merge(
                    $score?->weaknesses ?? [],
                    $score?->recommendations ?? []
                ))),
                'model_answer' => $modelAnswer,
            ]);
        } catch (\Throwable $e) {
            Log::warning('AI explain failed, using local fallback', [
                'interview_id' => $interview->id,
                'sequence' => $sequence,
                'error' => $e->getMessage(),
            ]);

            $evaluationService = app(EvaluationService::class);
            $explanation = $evaluationService->buildExplainArticle(
                $question->question_text,
                $question->category,
                $interview->job_title,
                $transcript,
                $score?->overall_score ?? 0,
                $score?->weaknesses ?? [],
            );
        }

        $context = $explanation['context'] ?? $explanation['summary'] ?? '';
        $gap = $explanation['gap_analysis'] ?? $explanation['feedback'] ?? '';
        $detailed = $explanation['detailed_answer'] ?? $explanation['example_answer'] ?? '';

        if ($this->isMetaExplainAnswer($detailed)) {
            $detailed = app(EvaluationService::class)->detailedAnswerArticle(
                $question->question_text,
                $question->category,
                $interview->job_title,
            );
        }

        $evaluationService = app(EvaluationService::class);
        $visualBreakdown = $explanation['visual_breakdown'] ?? $evaluationService->buildVisualBreakdown(
            $question->question_text,
            $question->category,
            $interview->job_title,
            $transcript,
        );

        return response()->json([
            'sequence' => $question->sequence,
            'question' => $question->question_text,
            'category' => $question->category,
            'your_answer' => $transcript,
            'score' => $score?->overall_score ?? 0,
            'context' => $context,
            'gap_analysis' => $gap,
            'detailed_answer' => $detailed,
            'visual_breakdown' => $visualBreakdown,
        ]);
    }

    private function isMetaExplainAnswer(string $text): bool
    {
        $lower = mb_strtolower(trim($text));
        if (mb_strlen($lower) < 80) {
            return true;
        }

        foreach (['a strong answer would', 'a strong answer uses', 'for "', 'for this question'] as $phrase) {
            if (str_contains($lower, $phrase)) {
                return true;
            }
        }

        return false;
    }

    public function regenerateReport(Request $request, Interview $interview): JsonResponse
    {
        $this->authorize('view', $interview);

        GenerateReportJob::dispatchSync($interview->fresh());

        return $this->report($request, $interview->fresh());
    }

    public function storeRecording(StoreRecordingRequest $request, Interview $interview): JsonResponse
    {
        $this->authorize('update', $interview);

        $path = $request->file('recording')->store(
            'interviews/'.$interview->id.'/full',
            'local'
        );

        $interview->update(['full_video_path' => $path]);

        return response()->json(['status' => 'stored', 'path' => $path]);
    }

    public function downloadPdf(Request $request, Interview $interview)
    {
        $this->authorize('view', $interview);

        $report = $interview->report;

        if (! $report?->pdf_path || ! Storage::disk('local')->exists($report->pdf_path)) {
            abort(404);
        }

        return Storage::disk('local')->download($report->pdf_path, 'interview-report-'.$interview->id.'.pdf');
    }
}
