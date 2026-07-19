<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpertChatMessage;
use App\Models\User;
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
            ->get(['id', 'role', 'content', 'created_at']);

        return response()->json(['messages' => $messages, 'session_id' => $sessionId]);
    }

    public function destroySession(Request $request): JsonResponse
    {
        $sessionId = (string) $request->query('session_id', '');

        if (! $sessionId || ! Str::isUuid($sessionId)) {
            return response()->json(['message' => 'Invalid session.'], 422);
        }

        ExpertChatMessage::query()
            ->where('user_id', $request->user()->id)
            ->where('session_id', $sessionId)
            ->delete();

        return response()->json([
            'message' => 'Chat cleared.',
            'session_id' => (string) Str::uuid(),
        ]);
    }

    public function destroyMessage(Request $request, ExpertChatMessage $expertChatMessage): JsonResponse
    {
        if ($expertChatMessage->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $expertChatMessage->delete();

        return response()->json(['message' => 'Message deleted.']);
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

        $userMessage = ExpertChatMessage::create([
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
                'context' => $this->buildKnowledgeBase($user),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Expert chat AI request failed, using fallback reply', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            $result = $this->buildOfflineExpertReply($message);
        }

        $reply = (string) ($result['reply'] ?? 'Sorry, I could not generate a response.');
        $followups = is_array($result['suggested_followups'] ?? null) ? $result['suggested_followups'] : [];

        $assistantMessage = ExpertChatMessage::create([
            'user_id' => $user->id,
            'session_id' => $sessionId,
            'role' => 'assistant',
            'content' => $reply,
        ]);

        return response()->json([
            'reply' => $reply,
            'suggested_followups' => $followups,
            'session_id' => $sessionId,
            'user_message_id' => $userMessage->id,
            'assistant_message_id' => $assistantMessage->id,
        ]);
    }

    /** Server-side facts the AI may draw on — the user cannot inject or override these. */
    private function buildKnowledgeBase(User $user): array
    {
        $completed = $user->interviews()
            ->where('status', 'completed')
            ->with('report:id,interview_id,overall_score')
            ->get();

        $scores = $completed->map(fn ($i) => $i->report?->overall_score)->filter()->values();
        $avgScore = $scores->isNotEmpty() ? (int) round($scores->avg()) : null;

        return [
            'platform' => 'Mock Interview Pro — AI-powered mock interview practice and coaching',
            'dimensions' => ['relevance', 'technical accuracy', 'communication', 'confidence', 'completeness'],
            'dimension_details' => [
                'relevance' => 'Did you address the question asked? Off-topic or evasive answers score low.',
                'technical_accuracy' => 'Are your facts, tools, and approach correct for the role? Names specific technologies.',
                'communication' => 'Is your answer structured and easy to follow? STAR for behavioral, step-by-step for technical.',
                'confidence' => 'Do you speak decisively without excessive hedging or filler words?',
                'completeness' => 'Did you cover the full scope — context, actions, and outcome?',
            ],
            'pass_threshold' => ScoringConstants::threshold('pass'),
            'mastery_threshold' => ScoringConstants::threshold('mastery'),
            'model_answer_threshold' => ScoringConstants::threshold('modelAnswer'),
            'hiring_recommendation_tiers' => ScoringConstants::get('thresholds.hiring'),
            'grade_bands' => ScoringConstants::get('dashboard.scoreBands'),
            'behavior_weights' => ScoringConstants::get('behavior'),
            'user_completed_interviews' => $completed->count(),
            'user_average_score' => $avgScore,
            'ai_stack' => [
                'llm' => 'Llama 3 8B (Ollama, model: '.(env('OLLAMA_MODEL', 'llama3')).')',
                'stt' => 'OpenAI Whisper (local, model: small)',
                'vision' => 'MediaPipe face mesh + emotion classifier + audio prosody analysis',
                'ai_service' => 'FastAPI Python service (port 8001)',
                'backend' => 'Laravel 11 API + queue workers + Reverb WebSocket',
                'frontend' => 'Next.js 16 React app',
            ],
            'evaluation_flow' => 'Whisper transcribes speech → Llama 3 scores five dimensions as JSON → '
                .'post-processing clamps and applies transcript overrides → heuristic fallback if Ollama offline → '
                .'behavior pipeline runs in parallel for video → report aggregated at session end.',
            'model_answer_policy' => 'When overall score is below '.ScoringConstants::threshold('modelAnswer').', '
                .'a concise ideal answer is generated so you can see what a stronger response looks like.',
            'behavior_analysis' => 'Video snapshots analyzed for eye contact, emotion distribution, head stability, '
                .'blink rate, and voice prosody. Produces confidence and nervousness scores alongside answer scores.',
            'mastery_memory' => 'Questions passed at or above mastery threshold ('.ScoringConstants::threshold('mastery').') '
                .'are recorded per user; future interviews skip mastered topics.',
            'star_method' => 'Behavioral answers coached via STAR: Situation, Task, Action, Result.',
            'report' => 'Final report includes overall score, category breakdown, strengths, weaknesses, '
                .'hiring recommendation, behavior summary, and downloadable PDF.',
        ];
    }

    /** Minimal reply when AI service is completely unreachable. */
    private function buildOfflineExpertReply(string $message): array
    {
        $lower = strtolower($message);

        if (str_contains($lower, 'model') || str_contains($lower, 'ollama') || str_contains($lower, 'llama')) {
            return [
                'reply' => 'Mock Interview Pro uses Llama 3 8B via Ollama for answer scoring, Whisper for speech-to-text, '
                    .'and MediaPipe for video behavior analysis — all running locally on your machine. '
                    .'The AI service appears offline right now, but the knowledge-based expert can still answer your questions.',
                'suggested_followups' => ['What scoring dimensions do you use?', 'How do you evaluate our answers?'],
            ];
        }

        return [
            'reply' => 'The AI service is temporarily unreachable. Please try again in a moment. '
                .'In the meantime: every answer is scored on relevance, technical accuracy, communication, '
                .'confidence, and completeness (0–100 each) using Llama 3, with a heuristic fallback when offline.',
            'suggested_followups' => ['What scoring dimensions do you use?', 'Which AI models power the scoring?'],
        ];
    }
}
