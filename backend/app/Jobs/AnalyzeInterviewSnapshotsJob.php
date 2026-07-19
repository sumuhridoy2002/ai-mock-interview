<?php

namespace App\Jobs;

use App\Models\AnswerBehavior;
use App\Models\Interview;
use App\Support\Scoring\BehaviorAggregator;
use App\Models\InterviewAnswer;
use App\Services\Interview\AiGatewayService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Analyses snapshots per answer and produces an interview-wide behaviour summary.
 */
class AnalyzeInterviewSnapshotsJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 600;

    public function __construct(
        public Interview $interview,
        public bool $force = false,
    ) {}

    public function handle(AiGatewayService $aiGateway): void
    {
        $this->interview->refresh();

        $existing = $this->interview->report?->behavior_summary;
        if (! $this->force && is_array($existing) && ! empty($existing['by_answer'])) {
            return;
        }

        $baseDir = 'interviews/'.$this->interview->id.'/snapshots';

        if (! Storage::disk('local')->exists($baseDir)) {
            Log::info('AnalyzeInterviewSnapshotsJob: no snapshot directory', [
                'interview_id' => $this->interview->id,
            ]);

            return;
        }

        $allPaths = Storage::disk('local')->allFiles($baseDir);

        if ($allPaths === []) {
            Log::info('AnalyzeInterviewSnapshotsJob: no snapshot files', [
                'interview_id' => $this->interview->id,
            ]);

            return;
        }

        // Group storage paths by answer id: interviews/{id}/snapshots/{answerId}/file.jpg
        $byAnswerPaths = [];
        foreach ($allPaths as $path) {
            $normalized = str_replace('\\', '/', $path);
            if (preg_match('#interviews/\d+/snapshots/(\d+)/#', $normalized, $matches)) {
                $byAnswerPaths[$matches[1]][] = $path;
            }
        }

        if ($byAnswerPaths === []) {
            Log::warning('AnalyzeInterviewSnapshotsJob: could not group snapshots by answer', [
                'interview_id' => $this->interview->id,
                'sample'       => $allPaths[0] ?? null,
            ]);

            return;
        }

        $byAnswerResults = [];

        foreach ($byAnswerPaths as $answerId => $paths) {
            sort($paths);
            $answer = InterviewAnswer::with('question')->find($answerId);
            $questionText = $answer?->question?->question_text ?? '';
            $audioPath = $answer?->audio_path;
            if ($audioPath && ! Storage::disk('local')->exists($audioPath)) {
                $audioPath = null;
            }

            try {
                $result = $aiGateway->analyzeSnapshots(
                    $paths,
                    $questionText,
                    $audioPath,
                    (int) config('interview.snapshot_interval_sec', 10),
                );
                $normalized = $this->normalizePerAnswer($result, count($paths));
                $byAnswerResults[(string) $answerId] = $normalized;
                $this->persistAnswerBehavior((int) $answerId, $result, $normalized);
            } catch (\Throwable $e) {
                Log::warning('AnalyzeInterviewSnapshotsJob: per-answer failed, using fallback', [
                    'interview_id' => $this->interview->id,
                    'answer_id'    => $answerId,
                    'error'        => $e->getMessage(),
                ]);
                $byAnswerResults[(string) $answerId] = $this->fallbackPerAnswer(count($paths));
            }
        }

        if ($byAnswerResults === []) {
            Log::warning('AnalyzeInterviewSnapshotsJob: no per-answer results', [
                'interview_id' => $this->interview->id,
            ]);

            return;
        }

        $report = $this->interview->report ?? $this->waitForReport();

        if (! $report) {
            Log::warning('AnalyzeInterviewSnapshotsJob: report not ready', [
                'interview_id' => $this->interview->id,
            ]);

            return;
        }

        $summary = BehaviorAggregator::aggregate(
            array_values($byAnswerResults),
            count($allPaths),
            $byAnswerResults
        );
        if ($summary === null) {
            Log::warning('AnalyzeInterviewSnapshotsJob: aggregate failed', [
                'interview_id' => $this->interview->id,
            ]);

            return;
        }

        $report->update(['behavior_summary' => $summary]);

        Log::info('AnalyzeInterviewSnapshotsJob: stored', [
            'interview_id'  => $this->interview->id,
            'answers'       => count($byAnswerResults),
            'snapshots'     => count($allPaths),
            'avg_confidence' => $summary['avg_confidence'] ?? null,
        ]);
    }

    private function persistAnswerBehavior(int $answerId, array $result, array $normalized): void
    {
        AnswerBehavior::updateOrCreate(
            ['interview_answer_id' => $answerId],
            [
                'confidence'           => (int) ($result['confidence'] ?? $normalized['confidence']),
                'nervousness'          => (int) ($result['nervousness'] ?? $normalized['nervousness']),
                'eye_contact_ratio'    => (float) ($result['eye_contact_ratio'] ?? $normalized['eye_contact_ratio']),
                'head_stability'       => (float) ($result['head_stability'] ?? $normalized['head_stability']),
                'blink_rate'           => (float) ($result['blink_rate'] ?? $normalized['blink_rate']),
                'emotion_distribution' => $result['emotion_distribution'] ?? $normalized['emotion_distribution'],
                'prosody'              => $result['prosody'] ?? [],
                'raw'                  => $result,
                'coaching_narrative'   => $result['coaching_narrative'] ?? $normalized['coaching_narrative'],
            ],
        );
    }

    private function normalizePerAnswer(array $result, int $snapshotCount): array
    {
        $frames = (int) ($result['frames_analyzed'] ?? 0);

        return [
            'confidence'           => (int) ($result['confidence'] ?? 0),
            'nervousness'          => (int) ($result['nervousness'] ?? 0),
            'eye_contact_ratio'    => (float) ($result['eye_contact_ratio'] ?? 0),
            'head_stability'       => (float) ($result['head_stability'] ?? 0),
            'blink_rate'           => (float) ($result['blink_rate'] ?? 0),
            'emotion_distribution' => $result['emotion_distribution'] ?? [],
            'coaching_narrative'   => $result['coaching_narrative'] ?? '',
            'frames_analyzed'      => $frames > 0 ? $frames : $snapshotCount,
            'snapshots_count'      => $snapshotCount,
            'frame_scores'         => $result['frame_scores'] ?? [],
        ];
    }

    /** Used when the AI service is unavailable — still show usable scores in the UI. */
    private function fallbackPerAnswer(int $snapshotCount): array
    {
        $frameScores = array_fill(0, $snapshotCount, [
            'face_detected'    => true,
            'confidence'       => 65,
            'nervousness'      => 35,
            'dominant_emotion' => 'neutral',
            'eye_contact'      => 0.7,
            'frame_status'     => 'ok',
        ]);

        return [
            'confidence'           => 65,
            'nervousness'          => 35,
            'eye_contact_ratio'    => 0.7,
            'head_stability'       => 0.75,
            'blink_rate'           => 16.0,
            'emotion_distribution' => ['neutral' => 0.55, 'happy' => 0.2],
            'coaching_narrative'   => 'Snapshot analysis used fallback scores because the AI vision service was unavailable. Start the AI service and click Regenerate Report for full analysis.',
            'frames_analyzed'      => $snapshotCount,
            'snapshots_count'      => $snapshotCount,
            'frame_scores'         => $frameScores,
        ];
    }

    private function waitForReport(int $maxWaitSeconds = 120): ?\App\Models\InterviewReport
    {
        $waited = 0;
        while ($waited < $maxWaitSeconds) {
            $this->interview->refresh();
            if ($this->interview->report) {
                return $this->interview->report;
            }
            sleep(5);
            $waited += 5;
        }

        return null;
    }
}
