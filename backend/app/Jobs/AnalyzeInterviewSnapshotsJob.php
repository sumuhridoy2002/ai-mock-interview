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
        // Gather every snapshot across all answers
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

        // Wait for the report to be generated (GenerateReportJob runs in parallel)
        $report = $this->waitForReport();

        if (! $report) {
            Log::warning('AnalyzeInterviewSnapshotsJob: report not ready after waiting, skipping save', [
                'interview_id' => $this->interview->id,
            ]);
            return;
        }

        $report->update(['behavior_summary' => $result]);

        Log::info('AnalyzeInterviewSnapshotsJob: behavior_summary stored', [
            'interview_id' => $this->interview->id,
            'confidence'   => $result['confidence'] ?? null,
            'nervousness'  => $result['nervousness'] ?? null,
            'snapshots'    => count($allPaths),
        ]);
    }

    /** Poll for up to 5 minutes until the report row exists. */
    private function waitForReport(int $maxWaitSeconds = 300): ?\App\Models\InterviewReport
    {
        $waited = 0;
        while ($waited < $maxWaitSeconds) {
            $this->interview->refresh();
            if ($this->interview->report) {
                return $this->interview->report;
            }
            sleep(10);
            $waited += 10;
        }
        return null;
    }
}
