<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnswerRequest;
use App\Http\Requests\StoreInterviewRequest;
use App\Http\Requests\StoreRecordingRequest;
use App\Jobs\AnalyzeInterviewSnapshotsJob;
use App\Jobs\EvaluateAnswerJob;
use App\Jobs\GenerateQuestionJob;
use App\Jobs\GenerateReportJob;
use App\Models\Interview;
use App\Models\InterviewAnswer;
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

            // If no unanswered question exists and the limit hasn't been reached,
            // the generation job was lost (e.g. queue worker was down). Kick it off again.
            $hasPending = $interview->questions()
                ->whereDoesntHave('answer')
                ->exists();

            if (! $hasPending && ! $this->interviewService->hasReachedQuestionLimit($interview)) {
                GenerateQuestionJob::dispatch($interview, $session);
            }
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

        // Transcript is provided by frontend real-time STT; no audio/video stored per-answer.
        $transcript = $request->input('transcript');

        $answer = $this->interviewService->submitAnswer(
            $interview,
            $question,
            $transcript,
            null,  // audio_path
            $request->input('idempotency_key'),
            $request->integer('duration_seconds') ?: null,
            null,  // video_path
        );

        if ($interview->session && ! $answer->score) {
            EvaluateAnswerJob::dispatch($interview, $interview->session, $answer);
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

        // Analyse all snapshots from all answers together after the interview ends
        AnalyzeInterviewSnapshotsJob::dispatch($interview);

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

        $recordingUrl = $interview->full_video_path
            ? url('/api/v1/interviews/'.$interview->id.'/recording')
            : null;

        // Enrich question_reviews with answer_id and snapshot_count
        $reportJson = $report->report_json;
        if (! empty($reportJson['question_reviews'])) {
            $answerMap = $interview->questions()
                ->with('answer')
                ->get()
                ->keyBy('sequence')
                ->map(fn ($q) => $q->answer);

            $reportJson['question_reviews'] = array_map(function ($review) use ($answerMap, $interview) {
                $seq = $review['sequence'] ?? null;
                $answer = $seq ? ($answerMap[$seq] ?? null) : null;
                if ($answer) {
                    $review['answer_id'] = $answer->id;
                    $snapshotDir = 'interviews/'.$interview->id.'/snapshots/'.$answer->id;
                    $review['snapshot_count'] = count(
                        Storage::disk('local')->files($snapshotDir)
                    );
                }
                return $review;
            }, $reportJson['question_reviews']);
        }

        return response()->json([
            'report'                => $reportJson,
            'overall_score'         => $report->overall_score,
            'hiring_recommendation' => $report->hiring_recommendation,
            'pdf_url'               => $pdfUrl,
            'recording_url'         => $recordingUrl,
            'behavior_summary'      => $report->behavior_summary,
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

    public function streamRecording(Request $request, Interview $interview): \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $interview);

        $path = $interview->full_video_path;

        if (! $path || ! Storage::disk('local')->exists($path)) {
            return response()->json(['message' => 'Recording not found.'], 404);
        }

        $size = Storage::disk('local')->size($path);
        $mime = str_ends_with($path, '.mp4') ? 'video/mp4' : 'video/webm';

        $rangeHeader = $request->header('Range');

        if ($rangeHeader) {
            preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $matches);
            $start = (int) ($matches[1] ?? 0);
            $end   = isset($matches[2]) && $matches[2] !== '' ? (int) $matches[2] : $size - 1;
            $end   = min($end, $size - 1);
            $length = $end - $start + 1;

            return response()->stream(function () use ($path, $start, $length) {
                $stream = Storage::disk('local')->readStream($path);
                if ($stream === null) return;
                if ($start > 0) fseek($stream, $start);
                $remaining = $length;
                while (! feof($stream) && $remaining > 0) {
                    $chunk = fread($stream, min(65536, $remaining));
                    if ($chunk === false) break;
                    echo $chunk;
                    $remaining -= strlen($chunk);
                }
                fclose($stream);
            }, 206, [
                'Content-Type'  => $mime,
                'Accept-Ranges' => 'bytes',
                'Content-Range' => "bytes {$start}-{$end}/{$size}",
                'Content-Length' => $length,
            ]);
        }

        return response()->stream(function () use ($path) {
            $stream = Storage::disk('local')->readStream($path);
            if ($stream === null) return;
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type'   => $mime,
            'Accept-Ranges'  => 'bytes',
            'Content-Length' => $size,
            'Content-Disposition' => 'inline; filename="interview-recording.webm"',
        ]);
    }

    /**
     * Accept snapshot images captured every ~15 s during an answer recording.
     * Stores the images and queues AnalyzeSnapshotsJob (no cv2 required).
     */
    public function submitSnapshots(Request $request, Interview $interview, int $answerId): JsonResponse
    {
        $this->authorize('update', $interview);

        $answer = InterviewAnswer::where('id', $answerId)
            ->whereHas('question', fn ($q) => $q->where('interview_id', $interview->id))
            ->firstOrFail();

        $request->validate([
            'snapshots'   => 'required|array|min:1|max:30',
            'snapshots.*' => 'required|file|mimes:jpg,jpeg,png|max:2048',
        ]);

        $paths = [];
        foreach ($request->file('snapshots') as $file) {
            $paths[] = $file->store('interviews/'.$interview->id.'/snapshots/'.$answerId, 'local');
        }

        // Snapshots are stored for batch analysis at interview completion — no per-answer job dispatched here.
        return response()->json(['status' => 'stored', 'snapshots' => count($paths)], 202);
    }

    /**
     * List all snapshot filenames for a given answer.
     * GET /interviews/{interview}/answers/{answerId}/snapshots
     */
    public function listSnapshots(Request $request, Interview $interview, int $answerId): JsonResponse
    {
        $this->authorize('view', $interview);

        $dir = 'interviews/'.$interview->id.'/snapshots/'.$answerId;
        $files = Storage::disk('local')->exists($dir)
            ? Storage::disk('local')->files($dir)
            : [];

        $urls = array_map(
            fn ($path) => url('/api/v1/interviews/'.$interview->id.'/answers/'.$answerId.'/snapshots/'.basename($path)),
            $files
        );

        return response()->json(['snapshots' => array_values($urls)]);
    }

    /**
     * Stream a single snapshot image file (authenticated).
     * GET /interviews/{interview}/answers/{answerId}/snapshots/{filename}
     */
    public function streamSnapshot(Request $request, Interview $interview, int $answerId, string $filename): \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $interview);

        // Sanitise filename — no path traversal
        $filename = basename($filename);
        $path = 'interviews/'.$interview->id.'/snapshots/'.$answerId.'/'.$filename;

        if (! Storage::disk('local')->exists($path)) {
            return response()->json(['message' => 'Snapshot not found.'], 404);
        }

        $mime = str_ends_with($filename, '.png') ? 'image/png' : 'image/jpeg';

        return response()->stream(function () use ($path) {
            $stream = Storage::disk('local')->readStream($path);
            if ($stream === null) return;
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type'  => $mime,
            'Cache-Control' => 'private, max-age=3600',
        ]);
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
