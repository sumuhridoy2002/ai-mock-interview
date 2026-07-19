<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpertChatMessage;
use App\Services\Interview\AiGatewayService;
use App\Services\Interview\PromptSanitizer;
use App\Support\Scoring\ScoringConstants;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ExpertChatController extends Controller
{
    public function __construct(
        private readonly AiGatewayService $aiGateway,
        private readonly PromptSanitizer $sanitizer,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $sessionId = (string) $request->query('session_id', '');

        if (! $sessionId || ! Str::isUuid($sessionId)) {
            return response()->json(['messages' => [], 'session_id' => (string) Str::uuid()]);
        }

        $messages = ExpertChatMessage::query()
            ->where('user_id', $request->user()->id)
            ->where('session_id', $sessionId)
            ->orderBy('created_at')
            ->get(['role', 'content', 'created_at']);

        return response()->json(['messages' => $messages, 'session_id' => $sessionId]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'message' => ['required', 'string', 'max:1000'],
            'session_id' => ['nullable', 'uuid'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Invalid request.', 'errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $sessionId = $request->string('session_id')->toString() ?: (string) Str::uuid();
        $message = $this->sanitizer->sanitize($request->string('message')->toString());

        if ($message === '') {
            return response()->json(['message' => 'Message cannot be empty.'], 422);
        }

        ExpertChatMessage::create([
            'user_id' => $user->id,
            'session_id' => $sessionId,
            'role' => 'user',
            'content' => $message,
        ]);

        $history = ExpertChatMessage::query()
            ->where('user_id', $user->id)
            ->where('session_id', $sessionId)
            ->orderBy('created_at')
            ->get(['role', 'content'])
            ->map(fn (ExpertChatMessage $m) => ['role' => $m->role, 'content' => $m->content])
            ->toArray();

        try {
            $result = $this->aiGateway->expertChat([
                'message' => $message,
                'history' => array_slice($history, 0, -1),
                'context' => $this->buildKnowledgeBase(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Expert chat AI request failed, using fallback reply', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            $result = [
                'reply' => 'I could not reach the AI service right now. Please try again in a moment — the platform '
                    .'scores every answer across five dimensions (relevance, technical accuracy, communication, '
                    .'confidence, completeness) using a local Llama 3 model, with a heuristic fallback if that model is offline.',
                'suggested_followups' => [
                    'What scoring dimensions do you use?',
                    'How does behavior analysis affect my score?',
                ],
            ];
        }

        $reply = (string) ($result['reply'] ?? 'Sorry, I could not generate a response.');
        $followups = is_array($result['suggested_followups'] ?? null) ? $result['suggested_followups'] : [];

        ExpertChatMessage::create([
            'user_id' => $user->id,
            'session_id' => $sessionId,
            'role' => 'assistant',
            'content' => $reply,
        ]);

        return response()->json([
            'reply' => $reply,
            'suggested_followups' => $followups,
            'session_id' => $sessionId,
        ]);
    }

    /** Server-side facts the AI may draw on — the user cannot inject or override these. */
    private function buildKnowledgeBase(): array
    {
        return [
            'platform' => 'Mock Interview Pro — AI-powered mock interview practice and coaching',
            'dimensions' => ['relevance', 'technical accuracy', 'communication', 'confidence', 'completeness'],
            'pass_threshold' => ScoringConstants::threshold('pass'),
            'mastery_threshold' => ScoringConstants::threshold('mastery'),
            'model_answer_threshold' => ScoringConstants::threshold('modelAnswer'),
            'hiring_recommendation_tiers' => ScoringConstants::get('thresholds.hiring'),
            'grade_bands' => ScoringConstants::get('dashboard.scoreBands'),
            'evaluation_flow' => 'A local Llama 3 model (via Ollama) reads the question and your transcript and '
                .'scores it like a hiring manager would across the five dimensions above, producing an overall '
                .'score 0-100. If the AI model is offline, a rule-based heuristic evaluator scores the answer '
                .'instead so you always get feedback.',
            'model_answer_policy' => 'When your overall score is below the model-answer threshold, we generate a '
                .'concise ideal answer so you can see what a stronger response looks like.',
            'behavior_analysis' => 'For video interviews, we analyze eye contact, facial emotion, head stability, '
                .'blink rate, and voice prosody (pitch variance, pause ratio) to produce confidence and '
                .'nervousness scores. These appear alongside — not instead of — your answer scores.',
            'mastery_memory' => 'Questions you already pass (score at or above the mastery threshold) are recorded '
                .'per user, so future interviews can skip questions you have already mastered.',
            'star_method' => 'For behavioral questions, we coach candidates to use the STAR method: Situation, '
                .'Task, Action, Result.',
            'report' => 'After an interview completes, scores are aggregated into a final report with an overall '
                .'score, category breakdown, strengths, weaknesses, and a hiring recommendation, downloadable as a PDF.',
        ];
    }
}
