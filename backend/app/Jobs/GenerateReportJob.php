<?php

namespace App\Jobs;

use App\Models\Interview;
use App\Services\Interview\AiGatewayService;
use App\Services\Interview\ReportService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class GenerateReportJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public Interview $interview) {}

    public function handle(AiGatewayService $aiGateway, ReportService $reportService): void
    {
        $payload = $reportService->buildPayload($this->interview);
        $reportData = $reportService->buildLocalReport($payload);
        $questionReviews = $reportData['question_reviews'] ?? [];

        if ($aiGateway->health()) {
            try {
                $aiReport = $aiGateway->generateReport($payload);
                $reportData = array_merge($aiReport, [
                    'question_reviews' => $questionReviews,
                ]);
            } catch (\Throwable $e) {
                Log::warning('AI report enhancement skipped, using local scores', [
                    'interview_id' => $this->interview->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        try {
            $reportService->generate($this->interview, $reportData);
        } catch (\Throwable $e) {
            Log::error('GenerateReportJob failed', [
                'interview_id' => $this->interview->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
