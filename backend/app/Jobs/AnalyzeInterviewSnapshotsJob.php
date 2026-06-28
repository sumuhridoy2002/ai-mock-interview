<?php

namespace App\Jobs;

use App\Models\Interview;
use App\Services\Interview\AiGatewayService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Analyses ALL snapshots captured across every answer in an interview.
 * Runs once after the interview is completed, producing a single behaviour
 * summary stored on the interview_reports row.
 */
class AnalyzeInterviewSnapshotsJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 300;

    public function __construct(public Interview $interview) {}

    public function handle(AiGatewayService $aiGateway): void
    {
        $this->interview->refresh();

        if ($this->interview->report?->behavior_summary) {
            return;
        }

        $baseDir = 'interviews/'.$this->interview->id.'/snapshots';

        if (! Storage::disk('local')->exists($baseDir)) {
            Log::info('AnalyzeInterviewSnapshotsJob: no snapshot directory found', [
                'interview_id' => $this->interview->id,
            ]);

            return;
        }

        $allPaths = Storage::disk('local')->allFiles($baseDir);

        if (empty($allPaths)) {
            Log::info('AnalyzeInterviewSnapshotsJob: no snapshots found', [
                'interview_id' => $this->interview->id,
            ]);

            return;
        }

        $answerDirs = count(array_unique(array_map(
            fn ($path) => dirname($path),
            $allPaths
        )));

        Log::info('AnalyzeInterviewSnapshotsJob: analysing snapshots', [
            'interview_id' => $this->interview->id,
            'count'        => count($allPaths),
        ]);

        try {
            $result = $aiGateway->analyzeSnapshots(
                $allPaths,
                $this->interview->job_title ?? ''
            );
        } catch (\Throwable $e) {
            Log::error('AnalyzeInterviewSnapshotsJob: AI call failed', [
                'interview_id' => $this->interview->id,
                'error'        => $e->getMessage(),
            ]);

            throw $e;
        }

        $report = $this->interview->report ?? $this->waitForReport();

        if (! $report) {
            Log::warning('AnalyzeInterviewSnapshotsJob: report not ready after waiting, skipping save', [
                'interview_id' => $this->interview->id,
            ]);

            return;
        }

        $report->update(['behavior_summary' => $this->normalizeSummary($result, count($allPaths), $answerDirs)]);

        Log::info('AnalyzeInterviewSnapshotsJob: behavior_summary stored', [
            'interview_id' => $this->interview->id,
            'confidence'   => $result['confidence'] ?? null,
            'nervousness'  => $result['nervousness'] ?? null,
            'snapshots'    => count($allPaths),
        ]);
    }

    /** Map AI pipeline output to the aggregate format expected by the frontend. */
    private function normalizeSummary(array $result, int $snapshotCount, int $answerDirs): array
    {
        return [
            'avg_confidence'       => (int) ($result['confidence'] ?? 0),
            'avg_nervousness'      => (int) ($result['nervousness'] ?? 0),
            'avg_eye_contact'      => (float) ($result['eye_contact_ratio'] ?? 0),
            'avg_head_stability'   => (float) ($result['head_stability'] ?? 0),
            'avg_blink_rate'       => (float) ($result['blink_rate'] ?? 0),
            'emotion_distribution' => $result['emotion_distribution'] ?? [],
            'coaching_narrative'   => $result['coaching_narrative'] ?? '',
            'questions_analyzed'   => max(1, $answerDirs),
            'snapshots_analyzed'   => $snapshotCount,
            'frames_analyzed'      => (int) ($result['frames_analyzed'] ?? $snapshotCount),
        ];
    }

    /** Poll for up to 2 minutes until the report row exists. */
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
