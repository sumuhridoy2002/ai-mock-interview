<?php

namespace App\Services\Interview;

use App\Models\Resume;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AiGatewayService
{
    public function __construct(
        private readonly PromptSanitizer $sanitizer,
    ) {}

    public function analyzeCv(string $text): array
    {
        return $this->post('/agents/cv/analyze', ['text' => $this->sanitizer->sanitize($text)]);
    }

    public function analyzeCvFile(Resume $resume): array
    {
        $path = Storage::disk('local')->path($resume->storage_path);
        $timeout = (int) config('ai.cv_timeout', config('ai.timeout'));

        try {
            $response = Http::timeout($timeout)
                ->retry(1, 500)
                ->withHeaders($this->headers())
                ->attach('file', file_get_contents($path), $resume->original_filename)
                ->post(config('ai.service_url').'/agents/cv/analyze-file');

            $response->throw();

            return $response->json();
        } catch (RequestException|ConnectionException $e) {
            Log::error('AI CV file analysis failed', [
                'resume_id' => $resume->id,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function analyzeJob(string $title, string $description): array
    {
        return $this->post('/agents/job/analyze', [
            'job_title' => $this->sanitizer->sanitize($title),
            'job_description' => $this->sanitizer->sanitize($description),
        ]);
    }

    public function generateQuestion(array $payload): array
    {
        if (isset($payload['last_answer'])) {
            $payload['last_answer'] = $this->sanitizer->sanitize($payload['last_answer']);
        }

        $payload['job_analysis'] = $this->normalizeJobAnalysis($payload['job_analysis'] ?? null);
        $payload['cv_profile']   = $this->normalizeProfile($payload['cv_profile'] ?? null);
        $payload['memory']       = $this->normalizeProfile($payload['memory'] ?? null);

        // user_memory is already a well-structured dict; normalise only the nested arrays
        $userMemory = $payload['user_memory'] ?? [];
        $payload['user_memory'] = [
            'mastered_questions'   => (array) ($userMemory['mastered_questions'] ?? []),
            'mastered_topics'      => (array) ($userMemory['mastered_topics'] ?? []),
            'prior_strengths'      => (array) ($userMemory['prior_strengths'] ?? []),
            'prior_weaknesses'     => (array) ($userMemory['prior_weaknesses'] ?? []),
            'interviews_completed' => (int) ($userMemory['interviews_completed'] ?? 0),
        ];

        return $this->post('/agents/questions/generate', $payload);
    }

    public function evaluateAnswer(array $payload): array
    {
        if (isset($payload['transcript'])) {
            $payload['transcript'] = $this->sanitizer->sanitize($payload['transcript']);
        }

        return $this->post('/agents/answers/evaluate', $payload, (int) config('ai.eval_timeout'));
    }

    public function explainAnswer(array $payload): array
    {
        if (isset($payload['transcript'])) {
            $payload['transcript'] = $this->sanitizer->sanitize($payload['transcript']);
        }
        if (isset($payload['question'])) {
            $payload['question'] = $this->sanitizer->sanitize($payload['question']);
        }

        return $this->post('/agents/answers/explain', $payload, (int) config('ai.timeout'));
    }

    public function transcribeAudio($audioFile, array $context = []): string
    {
        $timeout = (int) config('ai.transcribe_timeout');

        try {
            $response = Http::timeout($timeout)
                ->retry(1, 1000)
                ->withHeaders($this->headers())
                ->attach(
                    'audio',
                    file_get_contents($audioFile->getRealPath()),
                    $audioFile->getClientOriginalName()
                )
                ->post(config('ai.service_url').'/pipeline/transcribe', $this->transcribeContext($context));

            $response->throw();

            $transcript = trim((string) ($response->json('transcript') ?? ''));
            $qualityPoor = (bool) ($response->json('quality_poor') ?? false);

            if ($qualityPoor) {
                Log::warning('Whisper quality_poor flag set on inline transcription', [
                    'chars' => strlen($transcript),
                    'job_title' => $context['job_title'] ?? '',
                ]);
            }

            return $transcript;
        } catch (RequestException|ConnectionException $e) {
            Log::error('AI transcription failed', [
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function transcribeStoredFile(string $storagePath, string $filename = 'audio.webm', array $context = []): string
    {
        $absolutePath = Storage::disk('local')->path($storagePath);

        if (! is_readable($absolutePath)) {
            return '';
        }

        $timeout = (int) config('ai.transcribe_timeout');

        try {
            $response = Http::timeout($timeout)
                ->retry(1, 1000)
                ->withHeaders($this->headers())
                ->attach('audio', file_get_contents($absolutePath), $filename)
                ->post(config('ai.service_url').'/pipeline/transcribe', $this->transcribeContext($context));

            $response->throw();

            $transcript = trim((string) ($response->json('transcript') ?? ''));
            $qualityPoor = (bool) ($response->json('quality_poor') ?? false);

            if ($qualityPoor) {
                Log::warning('Whisper quality_poor flag on stored-file transcription', [
                    'path' => $storagePath,
                    'chars' => strlen($transcript),
                    'job_title' => $context['job_title'] ?? '',
                ]);
            }

            return $transcript;
        } catch (RequestException|ConnectionException $e) {
            Log::error('AI stored-file transcription failed', [
                'path' => $storagePath,
                'message' => $e->getMessage(),
            ]);

            return '';
        }
    }

    private function transcribeContext(array $context): array
    {
        $fields = [];

        if (! empty($context['job_title'])) {
            $fields['job_title'] = $context['job_title'];
        }

        if (! empty($context['required_skills'])) {
            $skills = is_array($context['required_skills'])
                ? $context['required_skills']
                : [];
            $fields['required_skills'] = json_encode($skills);
        }

        if (! empty($context['question'])) {
            $fields['question'] = (string) $context['question'];
        }

        return $fields;
    }

    public function generateReport(array $payload): array
    {
        $timeout = (int) config('ai.report_timeout', config('ai.timeout'));

        return $this->post('/agents/reports/generate', $payload, $timeout);
    }

    /**
     * Send a video file to the AI service vision pipeline for behavioural analysis.
     *
     * @param  string  $storagePath  Path on the `local` disk
     * @param  string  $question     The interview question asked (for narrative context)
     */
    public function analyzeBehavior(string $storagePath, string $question = ''): array
    {
        $absolutePath = Storage::disk('local')->path($storagePath);
        if (! is_readable($absolutePath)) {
            throw new \RuntimeException("Video file not readable: {$storagePath}");
        }

        $timeout = (int) config('ai.timeout', 120);

        try {
            $response = Http::timeout($timeout)
                ->withHeaders($this->headers())
                ->attach('video', file_get_contents($absolutePath), basename($storagePath))
                ->post(config('ai.service_url').'/pipeline/vision/analyze', [
                    'question'           => $question,
                    'generate_narrative' => 'true',
                ]);

            $response->throw();

            return $response->json();
        } catch (RequestException|ConnectionException $e) {
            Log::error('AI vision analysis failed', [
                'path'    => $storagePath,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function processVoice(array $payload, $audioFile): array
    {
        $response = Http::timeout(config('ai.timeout'))
            ->withHeaders($this->headers())
            ->attach('audio', file_get_contents($audioFile->getRealPath()), $audioFile->getClientOriginalName())
            ->post(config('ai.service_url').'/pipeline/voice/process', [
                'question' => $payload['question'] ?? '',
                'required_skills' => json_encode($payload['required_skills'] ?? []),
                'cv_profile' => json_encode($payload['cv_profile'] ?? []),
                'job_analysis' => json_encode($payload['job_analysis'] ?? []),
                'memory' => json_encode($payload['memory'] ?? []),
            ]);

        $response->throw();

        return $response->json();
    }

    public function health(): bool
    {
        try {
            return Http::timeout(5)
                ->get(config('ai.service_url').'/health')
                ->successful();
        } catch (ConnectionException) {
            return false;
        }
    }

    private function post(string $path, array $data, ?int $timeout = null): array
    {
        try {
            $response = Http::timeout($timeout ?? config('ai.timeout'))
                ->retry(2, 200)
                ->withHeaders($this->headers())
                ->post(config('ai.service_url').$path, $data);

            $response->throw();

            return $response->json();
        } catch (RequestException|ConnectionException $e) {
            Log::error('AI service request failed', [
                'path' => $path,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    private function headers(): array
    {
        $headers = ['Accept' => 'application/json'];

        if ($secret = config('ai.service_secret')) {
            $headers['X-AI-Secret'] = $secret;
        }

        return $headers;
    }

    private function normalizeJobAnalysis(mixed $value): array
    {
        if (! is_array($value) || $value === [] || array_is_list($value)) {
            return [
                'required_skills' => [],
                'responsibilities' => [],
                'seniority' => 'mid',
            ];
        }

        return $value;
    }

    private function normalizeProfile(mixed $value): array
    {
        if (! is_array($value) || array_is_list($value)) {
            return [];
        }

        return $value;
    }
}
