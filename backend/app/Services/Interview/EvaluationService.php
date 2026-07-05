<?php

namespace App\Services\Interview;

use App\Support\Scoring\HeuristicEvaluator;
use App\Support\Scoring\ScoringConstants;

class EvaluationService
{
    public function __construct(
        private readonly TranscriptCleaner $transcriptCleaner,
    ) {}

    public function buildLocalEvaluation(
        string $question,
        ?string $transcript,
        string $category = 'technical',
        array $requiredSkills = [],
    ): array {
        $cleaned = $this->transcriptCleaner->clean($transcript);
        $transcript = $cleaned['text'];
        $poorQuality = $cleaned['poor_quality'];
        $wordCount = str_word_count($transcript);

        if ($wordCount === 0) {
            return $this->wrapFixedResult('empty', $question, $category);
        }

        if ($this->isConfusionOrOffTopic($transcript, $question)) {
            return $this->wrapFixedResult('confusion', $question, $category);
        }

        if ($this->isRefusal($transcript)) {
            return $this->wrapFixedResult('refusal', $question, $category);
        }

        return HeuristicEvaluator::evaluate(
            $question,
            $transcript,
            $category,
            $requiredSkills,
            $poorQuality,
            fn (string $q, string $cat) => $this->modelAnswerFor($q, $cat),
        );
    }

    private function wrapFixedResult(string $type, string $question, string $category): array
    {
        $fixed = HeuristicEvaluator::fixedResult($type);
        $fixed['strengths'] = $fixed['strengths'] ?? [];
        $fixed['weaknesses'] = match ($type) {
            'empty' => ['We could not transcribe your spoken answer'],
            'refusal' => ['Did not attempt to answer the question'],
            'confusion' => ['Response did not address what the interviewer asked'],
            default => [],
        };
        $fixed['recommendations'] = match ($type) {
            'empty' => [
                'Speak clearly for at least 5 seconds after pressing Record',
                'Ensure your microphone is allowed in the browser',
            ],
            'refusal' => [
                'When unsure, share what you do know or describe a related experience instead of declining',
            ],
            'confusion' => [
                'Listen to the full question, then answer it directly — ask for clarification only if truly needed',
            ],
            default => [],
        };
        $fixed['model_answer'] = $this->modelAnswerFor($question, $category);
        $fixed['transcript_quality_poor'] = false;

        return $fixed;
    }

    public function applyTranscriptOverrides(array $evaluation, string $transcript, string $question, string $category): array
    {
        $cleaned = $this->transcriptCleaner->clean($transcript);
        $text = $cleaned['text'];

        if ($this->isConfusionOrOffTopic($text, $question)) {
            return $this->wrapFixedResult('confusion', $question, $category);
        }

        if ($this->isRefusal($text)) {
            return $this->wrapFixedResult('refusal', $question, $category);
        }

        return $evaluation;
    }

    public function isSkipOrNonAnswer(string $transcript, string $question = ''): bool
    {
        $text = trim($transcript);
        if ($text === '') {
            return true;
        }

        if ($this->isRefusal($text) || $this->isConfusionOrOffTopic($text, $question)) {
            return true;
        }

        $skipPatterns = [
            '/\bnext question\b/i',
            '/\bask me (the )?next\b/i',
            '/\bmove on\b/i',
            '/\black of knowledge\b/i',
            '/\bno knowledge\b/i',
            '/\bnot sure (about|how to)\b/i',
        ];

        foreach ($skipPatterns as $pattern) {
            if (preg_match($pattern, $text)) {
                return true;
            }
        }

        return false;
    }

    public function isSubstantiveAnswer(string $transcript, int $minWords = 12): bool
    {
        $text = trim($transcript);

        return $text !== ''
            && ! $this->isSkipOrNonAnswer($text)
            && str_word_count($text) >= $minWords;
    }

    public function shouldClarifyPrevious(string $lastAnswer, ?int $lastScore, string $lastQuestion = ''): bool
    {
        if ($lastScore === null || $lastScore >= ScoringConstants::threshold('clarifyPrevious')) {
            return false;
        }

        return $this->isSubstantiveAnswer($lastAnswer)
            && ! $this->isSkipOrNonAnswer($lastAnswer, $lastQuestion);
    }

    public function quotesLastAnswer(string $question, string $lastAnswer): bool
    {
        $answer = trim(preg_replace('/\s+/u', ' ', $lastAnswer) ?? $lastAnswer);
        if (mb_strlen($answer) < 12) {
            return false;
        }

        $normalizedQuestion = mb_strtolower($question);
        foreach ([80, 60, 40, 25] as $length) {
            $snippet = mb_strtolower(mb_substr($answer, 0, $length));
            if (mb_strlen($snippet) >= 20 && str_contains($normalizedQuestion, $snippet)) {
                return true;
            }
            if (mb_strlen($snippet) >= 15 && str_contains($normalizedQuestion, '"'.$snippet)) {
                return true;
            }
        }

        return str_contains($normalizedQuestion, 'you mentioned "')
            && $this->isSkipOrNonAnswer($lastAnswer);
    }

    public function isRefusal(string $transcript): bool
    {
        $text = trim($transcript);
        if ($text === '') {
            return false;
        }

        $wordCount = str_word_count($text);
        $patterns = [
            '/\bsorry\b/i',
            '/\b(can\'t|cannot|can not)\b.*\banswer\b/i',
            '/\b(don\'t|do not)\b know\b/i',
            '/\bno answer\b/i',
            '/\bpass on this\b/i',
            '/\bskip (this )?question\b/i',
            '/\bi (can\'t|cannot) (answer|respond)\b/i',
        ];

        $matches = 0;
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text)) {
                $matches++;
            }
        }

        if ($matches >= 1 && $wordCount <= 20) {
            return true;
        }

        return $matches >= 2;
    }

    public function isConfusionOrOffTopic(string $transcript, string $question): bool
    {
        $text = trim($transcript);
        if ($text === '') {
            return false;
        }

        $confusionPatterns = [
            '/\bcan you (please )?(ask|repeat)\b/i',
            '/\b(don\'t|do not) understand\b/i',
            '/\bcannot understand\b/i',
            '/\bwhat do you mean\b/i',
            '/\bplease ask me\b/i',
        ];

        foreach ($confusionPatterns as $pattern) {
            if (preg_match($pattern, $text)) {
                return true;
            }
        }

        preg_match_all('/\b[a-zA-Z]{4,}\b/', mb_strtolower($question), $questionMatches);
        preg_match_all('/\b[a-zA-Z]{4,}\b/', mb_strtolower($text), $answerMatches);

        $stopWords = ['tell', 'about', 'describe', 'what', 'your', 'would', 'could', 'please', 'this', 'that', 'with', 'from', 'have', 'been', 'when', 'where'];
        $questionWords = array_diff(array_unique($questionMatches[0] ?? []), $stopWords);
        $answerWords = array_unique($answerMatches[0] ?? []);

        if ($questionWords !== [] && array_intersect($questionWords, $answerWords) === [] && str_word_count($text) < 25) {
            return true;
        }

        return false;
    }

    public function modelAnswerFor(string $question, string $category = 'technical'): string
    {
        return match ($category) {
            'behavioral', 'communication' => "For \"{$question}\", a strong answer uses STAR: briefly set the Situation, explain your Task, describe specific Actions you took, and share the Result or outcome.",
            'technical', 'problem_solving' => "For \"{$question}\", explain your approach step-by-step, name Laravel features (routes, controllers, FormRequest, auth, Eloquent), and give a concrete example with outcome.",
            default => "For \"{$question}\", a strong answer is specific, structured, and includes a real example with clear actions and results relevant to the role.",
        };
    }

    public function buildExplainArticle(
        string $question,
        string $category,
        string $jobTitle,
        string $transcript,
        int $score,
        array $weaknesses = [],
    ): array {
        $declined = $transcript === ''
            || $this->isRefusal($transcript)
            || $this->isSkipOrNonAnswer($transcript, $question)
            || $score < 25;

        $context = 'This '.str_replace('_', ' ', $category).' question evaluates how you think on your feet for a '
            .$jobTitle.' role. The interviewer wants a structured, specific response with real examples.';

        if ($declined) {
            $gap = 'You declined or could not answer, so the interviewer did not hear your approach, priorities, or relevant experience. Even when unsure, outline how you would think through the problem.';
        } elseif ($score < 55) {
            $gap = 'Your response lacked concrete detail — the interviewer needs named actions, tools, and outcomes to assess your fit.';
        } else {
            $gap = 'Your answer had relevant points but could be expanded with clearer structure, specific examples, and a stronger outcome.';
        }

        return [
            'context' => $context,
            'gap_analysis' => $gap,
            'detailed_answer' => $this->detailedAnswerArticle($question, $category, $jobTitle),
            'visual_breakdown' => $this->buildVisualBreakdown($question, $category, $jobTitle, $transcript),
        ];
    }

    public function buildVisualBreakdown(string $question, string $category, string $jobTitle, string $transcript = ''): array
    {
        $q = mb_strtolower($question);

        if (str_contains($q, '30 day') || str_contains($q, 'first 30') || str_contains($q, 'first month')) {
            return [
                'type' => 'timeline',
                'title' => '30-day onboarding roadmap',
                'items' => [
                    [
                        'label' => 'Week 1 · Learn',
                        'description' => 'Clone repo, run tests, trace one user flow end-to-end, read README & recent PRs.',
                        'highlight' => 'Meet lead + senior dev',
                    ],
                    [
                        'label' => 'Weeks 2–3 · Contribute',
                        'description' => 'Pick a small ticket (bug fix, validation, minor API). Follow patterns, add tests, ship via review.',
                        'highlight' => 'First merged PR',
                    ],
                    [
                        'label' => 'Day 30 · Own',
                        'description' => 'Understand domain models & deploy pipeline. Document learnings, propose one small improvement.',
                        'highlight' => 'Show initiative safely',
                    ],
                ],
                ...$this->comparisonBlock($transcript),
            ];
        }

        if (str_contains($q, 'introduce') || str_contains($q, 'tell me about yourself')) {
            return [
                'type' => 'flow',
                'title' => 'Introduction answer flow',
                'items' => [
                    ['label' => '1. Who you are', 'description' => 'Role + years of experience + core stack (Laravel, PHP, MySQL).'],
                    ['label' => '2. Proof', 'description' => 'One concrete project with what you built and the outcome.'],
                    ['label' => '3. Why this role', 'description' => "Connect your background to {$jobTitle} and what you want to grow in."],
                ],
                ...$this->comparisonBlock($transcript),
            ];
        }

        if (str_contains($q, 'rest api') || (str_contains($q, 'api') && in_array($category, ['technical', 'problem_solving'], true))) {
            return [
                'type' => 'flow',
                'title' => 'Laravel REST API layers',
                'items' => [
                    ['label' => 'Routes', 'description' => 'Resource routes in routes/api.php, versioned if needed.'],
                    ['label' => 'Controller', 'description' => 'Thin controller — validate input, call service, return Resource.'],
                    ['label' => 'Form Request', 'description' => 'Centralized validation rules and error messages.'],
                    ['label' => 'Auth', 'description' => 'Sanctum tokens, auth:sanctum middleware, role abilities.'],
                    ['label' => 'Response', 'description' => 'API Resources + pagination + consistent error format.'],
                ],
                ...$this->comparisonBlock($transcript),
            ];
        }

        if ($category === 'behavioral' || str_contains($q, 'collaborat') || str_contains($q, 'deadline')) {
            return [
                'type' => 'star',
                'title' => 'STAR method breakdown',
                'items' => [
                    ['label' => 'S · Situation', 'description' => 'Set the scene — project, team, deadline or pressure.'],
                    ['label' => 'T · Task', 'description' => 'Your specific responsibility in that situation.'],
                    ['label' => 'A · Action', 'description' => 'Steps you personally took (tools, collaboration, decisions).'],
                    ['label' => 'R · Result', 'description' => 'Measurable outcome — on-time delivery, fewer bugs, happy client.'],
                ],
                ...$this->comparisonBlock($transcript),
            ];
        }

        if (str_contains($q, 'bug') || str_contains($q, 'performance') || $category === 'problem_solving') {
            return [
                'type' => 'steps',
                'title' => 'Debug & fix workflow',
                'items' => [
                    ['label' => 'Reproduce', 'description' => 'Replicate locally with similar data volume or traffic.'],
                    ['label' => 'Measure', 'description' => 'Query log, Laravel Debugbar, or APM to find bottleneck.'],
                    ['label' => 'Fix', 'description' => 'Eager-load, index, cache, or refactor the hot path.'],
                    ['label' => 'Verify', 'description' => 'Re-test, add regression test, deploy & monitor.'],
                ],
                ...$this->comparisonBlock($transcript),
            ];
        }

        if ($category === 'scenario') {
            return [
                'type' => 'steps',
                'title' => 'Scenario response structure',
                'items' => [
                    ['label' => 'Clarify', 'description' => 'Confirm constraints, stakeholders, and timeline.'],
                    ['label' => 'Prioritize', 'description' => 'List what matters most in the first 1–2 weeks.'],
                    ['label' => 'Plan', 'description' => 'Break into phases with clear deliverables.'],
                    ['label' => 'Communicate', 'description' => 'Share plan with lead, update daily, flag risks early.'],
                ],
                ...$this->comparisonBlock($transcript),
            ];
        }

        return [
            'type' => 'steps',
            'title' => 'Strong answer structure',
            'items' => [
                ['label' => 'Open', 'description' => 'Direct one-sentence answer to the question.'],
                ['label' => 'Example', 'description' => 'Real project story with Laravel/PHP specifics.'],
                ['label' => 'Detail', 'description' => 'Actions you took — tools, patterns, collaboration.'],
                ['label' => 'Close', 'description' => 'Outcome with a number or clear result.'],
            ],
            ...$this->comparisonBlock($transcript),
        ];
    }

    private function comparisonBlock(string $transcript): array
    {
        if (trim($transcript) === '') {
            return [];
        }

        $snippet = mb_strlen($transcript) > 200 ? mb_substr($transcript, 0, 197).'...' : $transcript;

        return [
            'comparison' => [
                'your_answer' => $snippet,
                'should_include' => 'Specific example · Named tools · Clear outcome',
            ],
        ];
    }

    public function detailedAnswerArticle(string $question, string $category, string $jobTitle): string
    {
        $q = mb_strtolower($question);

        if (str_contains($q, '30 day') || str_contains($q, 'first 30') || str_contains($q, 'first month')) {
            return "If I joined as a {$jobTitle}, I would structure my first 30 days around learning, contributing safely, and building trust with the team.\n\n"
                ."In week one, I would focus on understanding the codebase and delivery process. I would clone the repository, run the test suite locally, and trace one complete user flow — for example authentication through to a core feature. I would read the README, review recent pull requests, and note how the team organizes controllers, services, and Eloquent models. I would also meet my lead and one senior developer to clarify current sprint priorities and coding standards.\n\n"
                ."In weeks two and three, I would take ownership of a small, well-scoped ticket — such as a bug fix, validation improvement, or a minor API endpoint. I would follow existing patterns, write or update tests, and ship through code review.\n\n"
                ."By day 30, I would aim to understand the main domain models, deployment pipeline, and who to ask when blocked. I would document what I learned for future onboarding and propose one small improvement I noticed. That demonstrates initiative while staying realistic for a junior role.";
        }

        if (str_contains($q, 'introduce') || str_contains($q, 'tell me about yourself')) {
            return "Thank you for having me. I am a Laravel developer with hands-on experience building production web applications using PHP, Laravel, MySQL, and modern JavaScript frameworks.\n\n"
                ."Over the past few years I have delivered multiple client projects end-to-end — from database design and REST API development to authentication and deployment. For example, I built a queue management system where I designed the backend in Laravel, implemented user roles, optimized database queries, and integrated a Vue.js frontend. The application is now used in production reliably.\n\n"
                ."What excites me about this {$jobTitle} position is the chance to work on structured backend challenges, collaborate with a team, and keep growing in API design, testing, and performance. I am eager to contribute quickly while learning your team's conventions.";
        }

        if (str_contains($q, 'rest api') || (str_contains($q, 'api') && in_array($category, ['technical', 'problem_solving'], true))) {
            return "When I structure a REST API in Laravel, I start with clear resource-oriented routes in routes/api.php. Each endpoint maps to a slim controller method that delegates business logic to a service class.\n\n"
                ."For validation, I use Form Request classes so rules live in one place. For authentication, I typically use Laravel Sanctum — issuing tokens on login, protecting routes with auth:sanctum, and scoping abilities per role.\n\n"
                ."On a recent project I built an API for a dashboard serving filtered reports to a Vue frontend. I used API Resources to control JSON shape, added pagination, and wrote feature tests for happy paths and validation failures. That kept the API predictable and maintainable as endpoints grew.";
        }

        if (str_contains($q, 'project') && $category === 'technical') {
            return "One recent project I worked on was a Laravel-based web application for managing customer queues and service tokens. I was responsible for the backend architecture and core features.\n\n"
                ."I designed the database schema with Eloquent relationships, built REST endpoints for creating queues and tracking status, and implemented role-based permissions. The outcome was a stable production system that reduced manual coordination for the client.\n\n"
                ."That experience — migrations, seeders, PHPUnit tests, and shipping features without breaking existing flows — directly prepares me for similar backend work as a {$jobTitle}.";
        }

        if (str_contains($q, 'bug') || str_contains($q, 'performance') || $category === 'problem_solving') {
            return "On a production Laravel application I noticed report pages loading slowly during peak hours. I reproduced the issue locally, enabled query logging, and found an N+1 problem in the controller.\n\n"
                ."I fixed it by eager-loading relationships with with() and adding a composite index on filtered columns. I also cached aggregated counts for five minutes where real-time precision was not required.\n\n"
                ."After deployment, average response time dropped from about four seconds to under half a second. I documented the root cause and added a test to prevent the pattern from returning.";
        }

        if (str_contains($q, 'collaborat') || str_contains($q, 'deadline') || $category === 'behavioral') {
            return "On a client project we had a hard deadline for launching an admin dashboard before a marketing campaign. Two days before release, a payment gateway integration started failing in staging.\n\n"
                ."I paired with a frontend developer to divide work: I owned API debugging while they adjusted the UI. I traced the issue to mismatched payload validation, patched the Form Request rules, and added logging for failed callbacks.\n\n"
                ."We launched on time without payment errors. That taught me to communicate early when risk appears, split tasks clearly under pressure, and keep changes small when the deadline is tight.";
        }

        return "To answer this question in a {$jobTitle} interview, I would respond with a specific example from my experience.\n\n"
            ."I would open with a direct one-sentence answer, then describe the situation — what project or team I was on and what challenge we faced. Next I would explain the actions I took: Laravel features, database work, or collaboration steps, naming tools like Eloquent, migrations, Form Requests, or Git workflow.\n\n"
            ."I would close with a measurable outcome: faster performance, fewer bugs, on-time delivery, or improved user experience. That structure shows real experience and clear communication under interview pressure.";
    }

    private function emptyTranscriptResult(string $question, string $category): array
    {
        return [
            'score' => 0,
            'relevance' => 0,
            'technical_accuracy' => 0,
            'communication' => 0,
            'confidence' => 0,
            'completeness' => 0,
            'strengths' => [],
            'weaknesses' => ['We could not transcribe your spoken answer'],
            'recommendations' => [
                'Speak clearly for at least 5 seconds after pressing Record',
                'Ensure your microphone is allowed in the browser',
            ],
            'model_answer' => $this->modelAnswerFor($question, $category),
            'transcript_quality_poor' => false,
        ];
    }

    private function refusalResult(string $question, string $category): array
    {
        return [
            'score' => 8,
            'relevance' => 5,
            'technical_accuracy' => 0,
            'communication' => 10,
            'confidence' => 5,
            'completeness' => 0,
            'strengths' => [],
            'weaknesses' => ['Did not attempt to answer the question'],
            'recommendations' => [
                'When unsure, share what you do know or describe a related experience instead of declining',
            ],
            'model_answer' => $this->modelAnswerFor($question, $category),
            'transcript_quality_poor' => false,
        ];
    }

    private function confusionResult(string $question, string $category): array
    {
        return [
            'score' => 18,
            'relevance' => 12,
            'technical_accuracy' => 8,
            'communication' => 20,
            'confidence' => 15,
            'completeness' => 10,
            'strengths' => [],
            'weaknesses' => ['Response did not address what the interviewer asked'],
            'recommendations' => [
                'Listen to the full question, then answer it directly — ask for clarification only if truly needed',
            ],
            'model_answer' => $this->modelAnswerFor($question, $category),
            'transcript_quality_poor' => false,
        ];
    }

    private function targetedRecommendations(
        string $category,
        bool $tooBrief,
        bool $missingSkills,
        bool $missingTechnicalTerms,
        bool $repetitive,
        bool $weakTieIn,
    ): array {
        $picks = [];

        if ($tooBrief) {
            $picks[] = 'Expand with a concrete example: what you did, how you did it, and the outcome';
        }
        if ($missingSkills && in_array($category, ['technical', 'problem_solving'], true)) {
            $picks[] = 'Name specific tools from the job description (e.g. Laravel, MySQL, REST APIs)';
        } elseif ($missingSkills) {
            $picks[] = 'Connect your answer to skills or requirements mentioned in the job description';
        }
        if ($missingTechnicalTerms) {
            $picks[] = 'Explain the Laravel approach: routes, controllers, validation, auth, and database layer';
        }
        if ($repetitive) {
            $picks[] = 'Avoid repeating the same phrases — add new details in each sentence';
        }
        if ($weakTieIn) {
            $picks[] = 'Tie your experience more directly to the role you are interviewing for';
        }
        if ($category === 'behavioral' && ! $tooBrief && count($picks) < 2) {
            $picks[] = 'Structure with Situation, Task, Action, and Result when describing past experience';
        }
        if ($category === 'problem_solving' && ! $missingTechnicalTerms && count($picks) < 2) {
            $picks[] = 'Walk through diagnosis steps, the fix you applied, and how you verified it worked';
        }
        if ($category === 'scenario' && count($picks) < 2) {
            $picks[] = 'State your priorities first, then the actions you would take';
        }
        if ($category === 'communication' && count($picks) < 2) {
            $picks[] = 'Lead with your main point, then support it with one specific example';
        }

        if ($picks === []) {
            $picks[] = 'Add one more specific detail or metric to strengthen this answer';
        }

        return array_slice($picks, 0, 2);
    }
}
