<?php

namespace App\Jobs;

use App\Events\QuestionGenerated;
use App\Models\AgentMemory;
use App\Models\Interview;
use App\Models\InterviewQuestion;
use App\Models\InterviewSession;
use App\Services\Interview\AiGatewayService;
use App\Services\Interview\EvaluationService;
use App\Services\Interview\InterviewService;
use App\Services\Interview\MasteryService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class GenerateQuestionJob implements ShouldQueue
{
    use Queueable;

    private const REPETITIVE_PREFIXES = [
        'building on what you shared',
        'building on that',
        'building on what you shared about',
        'you mentioned "',
    ];

    public function __construct(
        public Interview $interview,
        public InterviewSession $session,
        public ?string $lastAnswer = null,
    ) {}

    public function handle(
        AiGatewayService $aiGateway,
        InterviewService $interviewService,
        EvaluationService $evaluationService,
        MasteryService $masteryService,
    ): void {
        if ($interviewService->hasReachedQuestionLimit($this->interview)) {
            return;
        }

        $this->interview->refresh();

        // Do not create a second unanswered question if one already exists.
        if ($this->interview->questions()->whereDoesntHave('answer')->exists()) {
            return;
        }

        try {
            $sequence = $interviewService->questionCount($this->interview) + 1;

            // Load cross-interview user memory (mastered questions/topics from all past interviews)
            $user = $this->interview->user;
            $userMemory = $user ? $interviewService->buildUserMemoryPayload($user) : [
                'mastered_questions'   => [],
                'mastered_topics'      => [],
                'prior_strengths'      => [],
                'prior_weaknesses'     => [],
                'interviews_completed' => 0,
            ];

            $payload = [
                'cv_profile'         => $this->interview->resume?->parsed_profile ?? [],
                'job_analysis'       => $this->interview->job_analysis ?? [],
                'memory'             => $interviewService->buildMemoryPayload($this->session),
                'user_memory'        => $userMemory,
                'experience_level'   => $this->interview->experience_level,
                'interview_type'     => $this->interview->interview_type,
                'last_answer'        => $this->lastAnswer,
                'question_number'    => $sequence,
                'job_title'          => $this->interview->job_title,
                'qa_history'         => $interviewService->buildInterviewHistory($this->interview),
            ];

            // Combine this-interview asked questions with all mastered questions from past interviews
            $askedThisInterview = $this->interview->questions()->pluck('question_text')->all();
            $masteredFromPast   = $userMemory['mastered_questions'] ?? [];
            $askedQuestions     = array_values(array_unique(array_merge(
                $askedThisInterview,
                $masteredFromPast,
            )));

            $masteredTopics = $userMemory['mastered_topics'] ?? [];

            try {
                $result = $aiGateway->generateQuestion($payload);
            } catch (\Throwable $e) {
                Log::warning('AI question generation failed, using fallback', [
                    'interview_id' => $this->interview->id,
                    'error' => $e->getMessage(),
                ]);
                $result = $this->fallbackQuestion($sequence, $askedQuestions, $masteredTopics, $interviewService, $evaluationService);
            }

            if (
                empty($result['question'] ?? '')
                || $this->isDuplicateQuestion($result['question'] ?? '', $askedQuestions)
                || $this->isRepetitiveTemplate($result['question'] ?? '', $askedQuestions)
                || $this->shouldRejectGeneratedQuestion($result['question'] ?? '', $interviewService, $evaluationService)
                || $this->isMasteredTopic($result['topic'] ?? null, $masteredTopics)
            ) {
                $result = $this->fallbackQuestion($sequence, $askedQuestions, $masteredTopics, $interviewService, $evaluationService);
            }

            $question = InterviewQuestion::create([
                'interview_id' => $this->interview->id,
                'sequence' => $sequence,
                'category' => $result['category'] ?? 'technical',
                'question_text' => $result['question'],
                'metadata' => [
                    'topic' => $result['topic'] ?? null,
                    'difficulty' => $result['difficulty'] ?? $this->interview->experience_level,
                ],
                'source' => $sequence === 1 ? 'generated' : 'follow_up',
            ]);

            $this->session->update(['current_question_index' => $sequence]);

            $memory = $this->session->latestMemory();
            if ($memory) {
                $questionsAsked = $memory->questions_asked ?? [];
                $questionsAsked[] = $result['question'];
                $topics = $memory->topics_covered ?? [];
                if (! empty($result['topic'])) {
                    $topics[] = $result['topic'];
                }
                $memory->update([
                    'questions_asked' => $questionsAsked,
                    'topics_covered' => array_values(array_unique($topics)),
                ]);
            }

            event(new QuestionGenerated($this->interview, $this->session, $question));
        } catch (\Throwable $e) {
            Log::error('GenerateQuestionJob failed', [
                'interview_id' => $this->interview->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function shouldRejectGeneratedQuestion(
        string $question,
        InterviewService $interviewService,
        EvaluationService $evaluationService,
    ): bool {
        $history = $interviewService->buildInterviewHistory($this->interview);
        if ($history === []) {
            return false;
        }

        $last = end($history);
        $lastAnswer = trim($last['answer'] ?? '');

        if ($lastAnswer === '') {
            return false;
        }

        if ($evaluationService->quotesLastAnswer($question, $lastAnswer)) {
            return true;
        }

        return $evaluationService->isSkipOrNonAnswer($lastAnswer)
            && str_contains(mb_strtolower($question), 'you mentioned');
    }

    private function isMasteredTopic(?string $topic, array $masteredTopics): bool
    {
        if (! $topic || $masteredTopics === []) {
            return false;
        }

        return in_array(mb_strtolower(trim($topic)), array_map('mb_strtolower', $masteredTopics), true);
    }

    private function fallbackQuestion(
        int $sequence,
        array $askedQuestions,
        array $masteredTopics,
        InterviewService $interviewService,
        EvaluationService $evaluationService,
    ): array {
        $cv = $this->interview->resume?->parsed_profile ?? [];
        $job = $this->interview->job_analysis ?? [];
        $title = $this->interview->job_title;
        $skills = $cv['skills'] ?? [];

        if ($sequence === 1) {
            $opening = ! empty($skills)
                ? "Thanks for joining. To start, please introduce yourself and tell me how your experience with {$skills[0]} relates to the {$title} role."
                : "Thanks for joining. Please introduce yourself and explain why you're interested in this {$title} position.";

            return [
                'question' => $opening,
                'category' => 'behavioral',
                'difficulty' => $this->interview->experience_level,
                'topic' => 'introduction',
            ];
        }

        $history = $interviewService->buildInterviewHistory($this->interview);
        $last = ! empty($history) ? end($history) : null;

        if ($last) {
            $lastScore = isset($last['score']) ? (int) $last['score'] : null;
            $lastAnswer = trim($last['answer'] ?? '');
            $lastQuestion = trim($last['question'] ?? '');

            if ($evaluationService->shouldClarifyPrevious($lastAnswer, $lastScore, $lastQuestion)) {
                $clarifier = "I'd like to understand that better — could you give me a concrete example with the steps you took and the result?";
                if (
                    ! $this->isDuplicateQuestion($clarifier, $askedQuestions)
                    && ! $this->isRepetitiveTemplate($clarifier, $askedQuestions)
                    && ! $this->isMasteredTopic('clarification', $masteredTopics)
                ) {
                    return [
                        'question' => $clarifier,
                        'category' => 'behavioral',
                        'difficulty' => $this->interview->experience_level,
                        'topic' => 'clarification',
                    ];
                }
            }
        }

        $pool = $this->followUpQuestionPool($cv, $job, $title);
        $startIdx = max(0, $sequence - 2) % count($pool);
        $lastWasSkip = $last && $evaluationService->isSkipOrNonAnswer(trim($last['answer'] ?? ''), trim($last['question'] ?? ''));

        for ($offset = 0; $offset < count($pool); $offset++) {
            $item = $pool[($startIdx + $offset) % count($pool)];
            if (
                ! $this->isDuplicateQuestion($item['question'], $askedQuestions)
                && ! $this->isRepetitiveTemplate($item['question'], $askedQuestions)
                && ! $this->isMasteredTopic($item['topic'] ?? null, $masteredTopics)
            ) {
                $questionText = $item['question'];
                if ($lastWasSkip) {
                    $questionText = "No problem — let's try a different topic. {$questionText}";
                }

                return [
                    'question' => $questionText,
                    'category' => $item['category'],
                    'difficulty' => $this->interview->experience_level,
                    'topic' => $item['topic'],
                ];
            }
        }

        return [
            'question' => "What else from your background should I know for this {$title} role?",
            'category' => 'communication',
            'difficulty' => $this->interview->experience_level,
            'topic' => 'closing',
        ];
    }

    private function detectRoleType(string $title, array $skills): string
    {
        $combined = mb_strtolower($title.' '.implode(' ', $skills));

        $techKeywords = ['developer', 'engineer', 'programmer', 'software', 'backend', 'frontend',
            'fullstack', 'devops', 'data scientist', 'machine learning', 'laravel', 'react',
            'django', 'node', 'python', 'java', 'php', 'api', 'cloud', 'sre', 'qa', 'tester', 'architect'];
        $adminKeywords = ['executive', 'admin', 'desk', 'clerk', 'assistant', 'coordinator',
            'secretary', 'receptionist', 'office', 'data entry', 'clerical', 'support'];
        $salesKeywords = ['sales', 'marketing', 'business development', 'account manager',
            'customer success', 'growth', 'seo', 'content', 'brand', 'digital marketing'];
        $hrKeywords = ['hr', 'human resources', 'talent', 'recruitment', 'recruiter', 'people', 'payroll'];
        $financeKeywords = ['finance', 'accounting', 'accountant', 'bookkeeper', 'financial', 'audit', 'tax'];
        $opsKeywords = ['manager', 'director', 'operations', 'supervisor', 'team lead',
            'project manager', 'product manager', 'scrum', 'agile'];

        foreach ($techKeywords as $k) { if (str_contains($combined, $k)) return 'technical'; }
        foreach ($adminKeywords as $k) { if (str_contains($combined, $k)) return 'administrative'; }
        foreach ($salesKeywords as $k) { if (str_contains($combined, $k)) return 'sales'; }
        foreach ($hrKeywords as $k) { if (str_contains($combined, $k)) return 'hr'; }
        foreach ($financeKeywords as $k) { if (str_contains($combined, $k)) return 'finance'; }
        foreach ($opsKeywords as $k) { if (str_contains($combined, $k)) return 'operations'; }

        return 'general';
    }

    private function followUpQuestionPool(array $cv, array $job, string $title): array
    {
        $allSkills = array_merge($cv['skills'] ?? [], $job['required_skills'] ?? []);
        $skill = $allSkills[0] ?? null;
        $roleType = $this->detectRoleType($title, $allSkills);

        if ($roleType === 'technical') {
            $skillStr = $skill ?? 'your main technical stack';
            return [
                ['question' => "Tell me about a recent project where you used {$skillStr}. What was your role and outcome?", 'category' => 'technical', 'topic' => 'projects'],
                ['question' => 'How do you approach debugging a complex issue in production?', 'category' => 'problem_solving', 'topic' => 'debugging'],
                ['question' => "If you joined as a {$title}, what would you focus on in your first 30 days?", 'category' => 'scenario', 'topic' => 'onboarding'],
                ['question' => 'Tell me about a time you collaborated with a team under a tight deadline.', 'category' => 'behavioral', 'topic' => 'teamwork'],
                ['question' => 'How do you ensure code quality and maintainability in your work?', 'category' => 'technical', 'topic' => 'quality'],
                ['question' => 'Describe a time you received critical technical feedback. How did you respond?', 'category' => 'behavioral', 'topic' => 'feedback'],
                ['question' => "What part of the {$title} role excites you most and why?", 'category' => 'communication', 'topic' => 'motivation'],
                ['question' => 'How do you stay current with new tools and technologies relevant to your role?', 'category' => 'scenario', 'topic' => 'learning'],
                ['question' => 'Walk me through how you approach planning and estimating a new feature or task.', 'category' => 'problem_solving', 'topic' => 'planning'],
                ['question' => 'Describe a situation where you had to make a technical decision with incomplete information.', 'category' => 'scenario', 'topic' => 'decision_making'],
            ];
        }

        if ($roleType === 'administrative') {
            $skillStr = $skill ?? 'Microsoft Office';
            return [
                ['question' => "How do you use tools like {$skillStr} in your daily work? Can you give a specific example?", 'category' => 'technical', 'topic' => 'tools'],
                ['question' => 'How do you prioritize and manage multiple tasks or deadlines at the same time?', 'category' => 'problem_solving', 'topic' => 'time_management'],
                ['question' => 'Describe a time you had to handle a difficult request from a colleague or client professionally.', 'category' => 'behavioral', 'topic' => 'communication'],
                ['question' => "What do you think the most important responsibility of a {$title} is?", 'category' => 'communication', 'topic' => 'role_understanding'],
                ['question' => 'Tell me about a time you noticed an error in a document or process and how you corrected it.', 'category' => 'problem_solving', 'topic' => 'attention_to_detail'],
                ['question' => 'How do you maintain confidentiality when handling sensitive information?', 'category' => 'behavioral', 'topic' => 'integrity'],
                ['question' => "If you joined as a {$title}, what would you do in your first week to get up to speed?", 'category' => 'scenario', 'topic' => 'onboarding'],
                ['question' => 'Describe a situation where you had to learn a new tool or system quickly. How did you approach it?', 'category' => 'scenario', 'topic' => 'learning'],
                ['question' => 'How do you handle situations where you receive unclear or conflicting instructions?', 'category' => 'behavioral', 'topic' => 'communication'],
                ['question' => 'Tell me about a time you improved an administrative process or helped the team work more efficiently.', 'category' => 'problem_solving', 'topic' => 'improvement'],
            ];
        }

        if ($roleType === 'sales') {
            return [
                ['question' => 'Tell me about a successful sale or campaign you were part of. What was your contribution?', 'category' => 'behavioral', 'topic' => 'achievements'],
                ['question' => 'How do you handle rejection or a lost deal? What do you do next?', 'category' => 'behavioral', 'topic' => 'resilience'],
                ['question' => "What strategies do you use to understand a customer's needs before pitching?", 'category' => 'technical', 'topic' => 'discovery'],
                ['question' => "If you joined as a {$title}, how would you approach your first 30 days building relationships?", 'category' => 'scenario', 'topic' => 'onboarding'],
                ['question' => 'Describe a time you managed multiple leads or accounts simultaneously.', 'category' => 'problem_solving', 'topic' => 'pipeline'],
                ['question' => 'How do you stay motivated when targets are challenging?', 'category' => 'communication', 'topic' => 'motivation'],
                ['question' => 'Tell me about a time you had to tailor your communication style for a specific audience.', 'category' => 'behavioral', 'topic' => 'communication'],
                ['question' => 'How do you keep up with competitor offerings and market trends?', 'category' => 'scenario', 'topic' => 'market_awareness'],
                ['question' => 'Describe a situation where you turned a negative customer experience into a positive one.', 'category' => 'behavioral', 'topic' => 'customer_success'],
                ['question' => 'What metrics do you track to measure your own performance?', 'category' => 'technical', 'topic' => 'metrics'],
            ];
        }

        if ($roleType === 'hr') {
            return [
                ['question' => 'Walk me through your approach to screening and shortlisting candidates for a role.', 'category' => 'technical', 'topic' => 'recruitment'],
                ['question' => 'Describe a time you handled a sensitive employee situation. How did you manage it?', 'category' => 'behavioral', 'topic' => 'employee_relations'],
                ['question' => 'How do you ensure fairness and consistency in performance reviews?', 'category' => 'technical', 'topic' => 'performance'],
                ['question' => 'Tell me about a time you had to communicate a difficult decision to an employee or team.', 'category' => 'behavioral', 'topic' => 'communication'],
                ['question' => 'How do you stay current with employment law or HR best practices?', 'category' => 'scenario', 'topic' => 'learning'],
                ['question' => 'Describe your experience with HR information systems or applicant tracking tools.', 'category' => 'technical', 'topic' => 'tools'],
                ['question' => 'How do you balance the needs of employees with the priorities of the business?', 'category' => 'problem_solving', 'topic' => 'balance'],
                ['question' => 'Tell me about a time you identified a gap in a people process and proposed an improvement.', 'category' => 'problem_solving', 'topic' => 'improvement'],
                ['question' => "If you joined as a {$title}, what would your first week focus on?", 'category' => 'scenario', 'topic' => 'onboarding'],
                ['question' => 'What does a healthy workplace culture look like to you, and how have you helped build it?', 'category' => 'communication', 'topic' => 'culture'],
            ];
        }

        if ($roleType === 'finance') {
            $skillStr = $skill ?? 'accounting tools';
            return [
                ['question' => "Tell me about your experience with {$skillStr}. How have you used it in a financial context?", 'category' => 'technical', 'topic' => 'tools'],
                ['question' => 'How do you ensure accuracy and reduce errors in financial reporting?', 'category' => 'problem_solving', 'topic' => 'accuracy'],
                ['question' => 'Describe a time you identified a financial discrepancy. How did you investigate and resolve it?', 'category' => 'problem_solving', 'topic' => 'reconciliation'],
                ['question' => "If you joined as a {$title}, what processes would you review first?", 'category' => 'scenario', 'topic' => 'onboarding'],
                ['question' => 'How do you manage month-end or year-end closing pressures?', 'category' => 'behavioral', 'topic' => 'deadlines'],
                ['question' => 'Tell me about a time you explained a complex financial matter to a non-finance stakeholder.', 'category' => 'communication', 'topic' => 'communication'],
                ['question' => 'How do you stay updated on regulatory or compliance changes that affect your work?', 'category' => 'scenario', 'topic' => 'compliance'],
                ['question' => 'Describe a process improvement you made in a finance or accounting workflow.', 'category' => 'problem_solving', 'topic' => 'improvement'],
                ['question' => 'How do you handle confidential financial information and maintain data integrity?', 'category' => 'behavioral', 'topic' => 'integrity'],
                ['question' => 'What financial software or ERP systems have you worked with?', 'category' => 'technical', 'topic' => 'systems'],
            ];
        }

        // operations / general
        $skillStr = $skill ?? 'your key skills';
        return [
            ['question' => "Tell me about a situation where you applied {$skillStr} to solve a real problem at work.", 'category' => 'behavioral', 'topic' => 'application'],
            ['question' => "What attracted you to the {$title} role, and what do you hope to achieve in it?", 'category' => 'communication', 'topic' => 'motivation'],
            ['question' => 'How do you handle competing priorities when everything feels urgent?', 'category' => 'problem_solving', 'topic' => 'time_management'],
            ['question' => 'Tell me about a time you had to adapt quickly to an unexpected change at work.', 'category' => 'behavioral', 'topic' => 'adaptability'],
            ['question' => "If you joined as a {$title}, what would your first 30 days look like?", 'category' => 'scenario', 'topic' => 'onboarding'],
            ['question' => 'Describe a time you worked with a team that had different working styles. How did you manage?', 'category' => 'behavioral', 'topic' => 'teamwork'],
            ['question' => 'Tell me about a project or task you are most proud of. What made it successful?', 'category' => 'behavioral', 'topic' => 'achievement'],
            ['question' => 'Describe a situation where you received feedback you disagreed with. How did you handle it?', 'category' => 'behavioral', 'topic' => 'feedback'],
            ['question' => 'How do you keep yourself organized and make sure nothing falls through the cracks?', 'category' => 'problem_solving', 'topic' => 'organization'],
            ['question' => "What skills or experience do you think will be most valuable to you in this {$title} position?", 'category' => 'communication', 'topic' => 'fit'],
        ];
    }

    private function isDuplicateQuestion(string $question, array $askedQuestions): bool
    {
        $normalized = $this->normalizeQuestionText($question);

        if ($normalized === '') {
            return true;
        }

        foreach ($askedQuestions as $asked) {
            if ($this->normalizeQuestionText($asked) === $normalized) {
                return true;
            }
        }

        return false;
    }

    private function isRepetitiveTemplate(string $question, array $askedQuestions): bool
    {
        $normalized = $this->normalizeQuestionText($question);

        if ($normalized === '') {
            return true;
        }

        foreach (self::REPETITIVE_PREFIXES as $prefix) {
            if (str_starts_with($normalized, $prefix)) {
                return true;
            }
        }

        $words = preg_split('/\s+/u', $normalized, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if (count($words) >= 4) {
            $opening = implode(' ', array_slice($words, 0, 5));
            foreach ($askedQuestions as $asked) {
                if (str_starts_with($this->normalizeQuestionText($asked), $opening)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function normalizeQuestionText(string $question): string
    {
        $text = preg_replace('/\s*\(follow-up\s*#\d+\)\s*$/i', '', trim($question)) ?? trim($question);
        $text = preg_replace('/\s*\(additional detail\s*#\d+\)\s*$/i', '', $text) ?? $text;
        // Strip skip-retry prefix so duplicate detection matches the core question text.
        $text = preg_replace('/^no problem — let\'s try a different topic\.\s*/iu', '', $text) ?? $text;

        return mb_strtolower(trim($text));
    }
}
